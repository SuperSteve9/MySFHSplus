import { initBuffers } from "./init-buffers.js";
import { drawScene } from "./draw-scene.js";

const playerPos = [0, 2.25, 0];
const playerRot = [0, 0, Math.PI];
const cubePositions = new Map();
const playerMovSpeed = 0.05;
const playerRotSpeed = 0.03;
let playerVelocity = 0.1;
const gravity = 0.0098;
const terminalVel = 0.3;
const keysPressed = {};
const flymode = false;
const canvas = document.querySelector("#glcanvas");
let lastFrameTime = performance.now();
let frameCount = 0;
let fps = 0;
let lastFpsUpdate = performance.now();


window.addEventListener("keydown", (event) => {
  keysPressed[event.key] = true;
});

window.addEventListener("keyup", (event) => {
  keysPressed[event.key] = false;
});

canvas.addEventListener("click", () => {
  console.log(raycast(3.2));
});

function generateChunk(x, y, cubePositions) {
  for (let i = 0; i > 16 * -1; i--) {
    for (let j = 0; j < 16; j++) {
      for (let k = 0; k > -2; k-=2) {
        const key = `${(j) + x * 16},${k},${(i) + y * 16}`;
        cubePositions.set(key, true);
      }
    }
  }
}

function raycast(range) {
  console.log(playerRot);
  const fray = [
    Math.cos(playerRot[1]) * Math.sin(playerRot[0]),
    Math.sin(playerRot[1]),
    Math.cos(playerRot[1]) * Math.cos(playerRot[0])
  ];
  const step = 0.1;

  for (let i = 0; i < range; i+= step) {
    const dx = playerPos[0] + fray[0] * i;
    const dy = playerPos[1] + fray[1] * i;
    const dz = playerPos[2] + fray[2] * i;

    const x = Math.floor(dx + 0.5);
    const y = Math.floor(dy + 0.5);
    const z = Math.floor(dz + 0.5);

    if (cubePositions.has(`${-x},${-y},${-z}`)) {
      cubePositions.delete(`${-x},${-y},${-z}`);
      break;
    }
  }

}

for (let i = -4; i < 4; i++) {
  for (let j = -4; j < 4; j++) {
    generateChunk(i, j, cubePositions);
  }
}
cubePositions.set(`${-1},${-1},${0}`, true);
cubePositions.set(`${-1},${-2},${0}`, true);
cubePositions.set(`${1},${-1},${0}`, true);

function touchingGround() {
  const x = Math.floor(playerPos[0] + 0.5);
  const y = Math.floor(playerPos[1] + 0.5);
  const z = Math.floor(playerPos[2] + 0.5);
  return cubePositions.has(`${-x},${-y + 2},${-z}`);
}

main();

//
// start here
//
function main() {
  const gl = canvas.getContext("webgl");
  
  if (gl === null) {
    alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    return;
  }

  // Vertex shader program

  const vsSource = `
  attribute vec4 aVertexPosition;
  attribute vec2 aTextureCoord;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  varying highp vec2 vTextureCoord;

  void main(void) {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vTextureCoord = aTextureCoord;
  }
`;

  // Fragment shader program

  const fsSource = `
  varying highp vec2 vTextureCoord;

  uniform sampler2D uSampler;

  void main(void) {
    gl_FragColor = texture2D(uSampler, vTextureCoord);
  }
`;

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Collect all the info needed to use the shader program.
  // Look up which attributes our shader program is using
  // for aVertexPosition, aVertexColor and also
  // look up uniform locations.
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      textureCoord: gl.getAttribLocation(shaderProgram, "aTextureCoord"),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(
        shaderProgram,
        "uProjectionMatrix"
      ),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
      uSampler: gl.getUniformLocation(shaderProgram, "uSampler"),
    },
  };

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  const buffers = initBuffers(gl);

  // Load texture
  const texture = loadTexture(gl, "cubetexture.png");
  // Flip image pixels into the bottom-to-top order that WebGL expects.
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  let then = 0;
  

  function render() {
    if (cubePositions.has(`${Math.floor(-playerPos[0] + 0.5)},${Math.floor(-playerPos[1] + 0.5)},${Math.floor(-playerPos[2] + 0.5)}`) || cubePositions.has(`${Math.floor(-playerPos[0] + 0.5)},${Math.floor(-playerPos[1] + 0.5) + 1},${Math.floor(-playerPos[2] + 0.5)}`)) {
      playerPos[2] -= Math.cos(playerRot[0]) * playerMovSpeed;
      playerPos[0] -= Math.sin(playerRot[0]) * playerMovSpeed;
    }
    const now = performance.now();
    const delta = now - lastFrameTime;
    lastFrameTime = now;
  
    // Update FPS every second
    frameCount++;
    if (now - lastFpsUpdate >= 1000) {
      fps = frameCount;
      frameCount = 0;
      lastFpsUpdate = now;
      console.log(`FPS: ${fps}`);
    }

  
    if (keysPressed["w"]) {
      playerPos[2] += Math.cos(playerRot[0]) * playerMovSpeed;
      playerPos[0] += Math.sin(playerRot[0]) * playerMovSpeed;
    }
    if (keysPressed["s"]) {
      playerPos[2] -= Math.cos(playerRot[0]) * playerMovSpeed;
      playerPos[0] -= Math.sin(playerRot[0]) * playerMovSpeed;
    }
    if (keysPressed["a"]) {
      playerPos[2] += Math.sin(playerRot[0]) * playerMovSpeed;
      playerPos[0] -= Math.cos(playerRot[0]) * playerMovSpeed;
    }
    if (keysPressed["d"]) {
      playerPos[2] -= Math.sin(playerRot[0]) * playerMovSpeed;
      playerPos[0] += Math.cos(playerRot[0]) * playerMovSpeed;
    }
    if (keysPressed["ArrowRight"]) {
      playerRot[0] += playerRotSpeed;
    }
    if (keysPressed["ArrowLeft"]) {
      playerRot[0] -= playerRotSpeed;
    }
    if (keysPressed["ArrowUp"]) {
      playerRot[1] += playerRotSpeed;
    }
    if (keysPressed["ArrowDown"]) {
      playerRot[1] -= playerRotSpeed;
    }
    if (keysPressed["r"]) {
      playerPos[0] = -16 + Math.random() * 32;
      playerPos[1] = 10
      playerPos[2] = -16 + Math.random() * 32;
    }

    if (keysPressed[" "]) {
      if (touchingGround()) {
        playerVelocity = -0.25;
      }
    }
    if (keysPressed["Shift"]) {
      if (flymode) {
        playerPos[1] -= playerMovSpeed;
      }
    }
    playerPos[1] -= playerVelocity;
    if (!touchingGround()) {
      if ( playerVelocity < terminalVel) {
        playerVelocity += gravity;
      }
    } else {
      playerVelocity = 0;
      playerPos[1] = Math.floor((playerPos[1] - 2.25) + 0.5) + 2.25;
    }
    // clamps
    if (playerRot[0] > Math.PI * 2) {
      playerRot[0] = 0;
    }
    if (playerRot[0] < (Math.PI * 2) * -1) {
      playerRot[0] = 0;
    }
    if (playerRot[1] > (1.0/2.0) * Math.PI) {
      playerRot[1] = (1.0/2.0) * Math.PI;
    }
    if (playerRot[1] < -1 * (1.0/2.0) * Math.PI) {
      playerRot[1] = -1 * (1.0/2.0) * Math.PI;
    }
  
    drawScene(gl, programInfo, buffers, texture, cubePositions, playerPos, playerRot);
  
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert(
      `Unable to initialize the shader program: ${gl.getProgramInfoLog(
        shaderProgram
      )}`
    );
    return null;
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(
      `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`
    );
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because images have to be downloaded over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    width,
    height,
    border,
    srcFormat,
    srcType,
    pixel
  );

  const image = new Image();
  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      srcFormat,
      srcType,
      image
    );

    // WebGL1 has different requirements for power of 2 images
    // vs non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      // Yes, it's a power of 2. Generate mips.
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      // No, it's not a power of 2. Turn off mips and set
      // wrapping to clamp to edge
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;

  return texture;
}

function isPowerOf2(value) {
  return (value & (value - 1)) === 0;
}