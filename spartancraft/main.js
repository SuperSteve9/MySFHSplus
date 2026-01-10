

// check if webgpu can be used and throw a tantrum if not
if (!navigator.gpu) throw new Error("WebGPU not supported!");


// the gpu gng
const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();

// get the canvas
const canvas = document.querySelector("#c");
const context = canvas.getContext("webgpu");

// uhh its like what pixels twin
const format = navigator.gpu.getPreferredCanvasFormat();
context.configure({ device, format });

// key shit

const keys = {};

document.addEventListener("keydown", (e) => {
    keys[e.code] = true;
});

document.addEventListener("keyup", (e) => {
    keys[e.code] = false;
});


async function loadTextureFromURL(device, url) {
  const img = new Image();
  img.src = url;

  // Important: if you load from another domain, you can hit CORS issues.
  // Keeping it same-origin (same folder / same server) avoids most pain.
  await img.decode();

  const bitmap = await createImageBitmap(img);

  const texture = device.createTexture({
    size: [bitmap.width, bitmap.height],
    format: "rgba8unorm", // good for normal color images
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
  });

  device.queue.copyExternalImageToTexture(
    { source: bitmap },
    { texture },
    [bitmap.width, bitmap.height]
  );

  return texture;
}



const sampler = device.createSampler({
  magFilter: "nearest",
  minFilter: "nearest",
  addressModeU: "repeat",
  addressModeV: "repeat",
});

const texture = await loadTextureFromURL(device, "grass.png");
const textureView = texture.createView();




// shaders
const shaderCode = `
struct Uniforms {
    m: mat4x4f,
};

@group(0) @binding(0) var<uniform> uni: Uniforms;

@group(0) @binding(1) var samp: sampler;
@group(0) @binding(2) var tex: texture_2d<f32>;

struct VSOut {
    @builtin(position) pos: vec4f,
    @location(0) uv: vec2f,
};

@vertex
fn vsMain(
    @location(0) position: vec3f,
    @location(1) uv: vec2f
) -> VSOut {
 var out: VSOut;
 out.pos = uni.m * vec4f(position, 1.0);
 out.uv = uv;
 return out;
 }

@fragment
fn fsMain(in: VSOut) -> @location(0) vec4f {
    return textureSample(tex, samp, in.uv);
}
`;

const shaderModule = device.createShaderModule({ code: shaderCode });

const depthFormat = "depth24plus";

function createDepthTexture() {
    return device.createTexture({
        size: [canvas.width, canvas.height],
        format: depthFormat,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
}

let depthTexture = createDepthTexture();


const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
        module: shaderModule,
        entryPoint: "vsMain",
        buffers: [
            {
                arrayStride: 20,
                attributes: [
                    { shaderLocation: 0, offset: 0, format: "float32x3" },
                    { shaderLocation: 1, offset: 12, format: "float32x2" },
                ],
            },
        ],
    },
    fragment: {
        module: shaderModule,
        entryPoint: "fsMain",
        targets: [{ format }],
    },
    primitive: {
        topology: "triangle-list",
    },
    depthStencil: {
        format: depthFormat,
        depthWriteEnabled: true,
        depthCompare: "less",
    },
});


const vertexData = new Float32Array([
  // Each vertex: x, y, z,  u, v

  // +Z (front)
  -0.5, -0.5,  0.5,  0, 1,
   0.5, -0.5,  0.5,  1, 1,
   0.5,  0.5,  0.5,  1, 0,
  -0.5,  0.5,  0.5,  0, 0,

  // -Z (back)
   0.5, -0.5, -0.5,  0, 1,
  -0.5, -0.5, -0.5,  1, 1,
  -0.5,  0.5, -0.5,  1, 0,
   0.5,  0.5, -0.5,  0, 0,

  // -X (left)
  -0.5, -0.5, -0.5,  0, 1,
  -0.5, -0.5,  0.5,  1, 1,
  -0.5,  0.5,  0.5,  1, 0,
  -0.5,  0.5, -0.5,  0, 0,

  // +X (right)
   0.5, -0.5,  0.5,  0, 1,
   0.5, -0.5, -0.5,  1, 1,
   0.5,  0.5, -0.5,  1, 0,
   0.5,  0.5,  0.5,  0, 0,

  // +Y (top)
  -0.5,  0.5,  0.5,  0, 1,
   0.5,  0.5,  0.5,  1, 1,
   0.5,  0.5, -0.5,  1, 0,
  -0.5,  0.5, -0.5,  0, 0,

  // -Y (bottom)
  -0.5, -0.5, -0.5,  0, 1,
   0.5, -0.5, -0.5,  1, 1,
   0.5, -0.5,  0.5,  1, 0,
  -0.5, -0.5,  0.5,  0, 0,
]);



const indexData = new Uint16Array([
  0, 1, 2, 0, 2, 3,       // front
  4, 5, 6, 4, 6, 7,       // back
  8, 9,10, 8,10,11,       // left
 12,13,14,12,14,15,       // right
 16,17,18,16,18,19,       // top
 20,21,22,20,22,23,       // bottom
]);


const indexBuffer = device.createBuffer({
    size: indexData.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(indexBuffer, 0, indexData);


const vertexBuffer = device.createBuffer({
    size: vertexData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(vertexBuffer, 0, vertexData);

const uniformBuffer = device.createBuffer({
    size: 64,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
        { binding: 0, resource: { buffer: uniformBuffer } },
        { binding: 1, resource: sampler },
        { binding: 2, resource: textureView },
    ],
});

function mat4Perspective(fov, aspect, near, far) {
  const f = 1 / Math.tan(fov / 2);
  return new Float32Array([
    f/aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far+near)/(near-far), -1,
    0, 0, (2*far*near)/(near-far), 0,
  ]);
}

let x = 0.0;
let y = 0.0;
let z = -2.0;
let t = Math.PI;
let u = 0.0;

function frame() {

    if (keys["KeyW"]) { z-=(0.01 * Math.cos(t)); x-=(0.01 * Math.sin(t)); }
    if (keys["KeyS"]) { z+=(0.01 * Math.cos(t)); x+=(0.01 * Math.sin(t)); }
    if (keys["KeyA"]) { z+=(0.01 * Math.sin(t)); x-=(0.01 * Math.cos(t)); }
    if (keys["KeyD"]) { z-=(0.01 * Math.sin(t)); x+=(0.01 * Math.cos(t)); }
    if(keys["ArrowLeft"]) t+=0.03;
    if(keys["ArrowRight"]) t-=0.03;
    if(keys["ArrowUp"]) u+=0.03;
    if(keys["ArrowDown"]) u-=0.03;

    console.log(x, y, z, t);

    t = t % (Math.PI * 2);
    u = u % (Math.PI * 2);

    const aspect = canvas.width / canvas.height;
    const fov = 60 * Math.PI / 180;
    const near = 0.1;
    const far = 100.0;
    const f = 1.0 / Math.tan(fov / 2);

    const proj = mat4Perspective(fov, aspect, near, far);

    const modelMat = mat4RotationY(0); 

    const rotMat = mat4Mul(mat4RotationX(-u), mat4RotationY(-t));

    const viewMat = mat4Mul(rotMat,mat4Translation(-x, -y, -z));

    const vp = mat4Mul(proj, viewMat);
    const mvp = mat4Mul(vp, modelMat);

    device.queue.writeBuffer(uniformBuffer, 0, mvp);


    const texture = context.getCurrentTexture();
    const view = texture.createView();

    const encoder = device.createCommandEncoder();

    const pass = encoder.beginRenderPass({
        colorAttachments: [
            {
                view,
                clearValue: { r: 0.53, g: 0.80, b: 0.92, a: 1.0 },
                loadOp: "clear",
                storeOp: "store",
            },
        ],
        depthStencilAttachment:
            {
            view: depthTexture.createView(),
            depthClearValue: 1.0,
            depthLoadOp: "clear",
            depthStoreOp: "store",
            },
    });

    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.setIndexBuffer(indexBuffer, "uint16");
    pass.drawIndexed(36);

    pass.end();

    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);

    requestAnimationFrame(frame);
}


requestAnimationFrame(frame);


function mat4Mul(a, b) {
  const out = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      out[c*4 + r] =
        a[0*4 + r] * b[c*4 + 0] +
        a[1*4 + r] * b[c*4 + 1] +
        a[2*4 + r] * b[c*4 + 2] +
        a[3*4 + r] * b[c*4 + 3];
    }
  }
  return out;
}

function mat4Translation(x, y, z) {
  return new Float32Array([
    1,0,0,0,
    0,1,0,0,
    0,0,1,0,
    x,y,z,1,
  ]);
}


// MESS WITH THIS
function mat4RotationY(a) {
  const c = Math.cos(a), s = Math.sin(a);
  return new Float32Array([
    c, 0, -s, 0,
    0, 1, 0, 0,
    s, 0, c, 0,
    0, 0, 0, 1,
  ]);
}

function mat4RotationX(a) {
    const c = Math.cos(a), s = Math.sin(a);
    return new Float32Array([
        1, 0, 0, 0,
        0, c, s, 0,
        0, -s, c, 0,
        0, 0, 0, 1,
    ]);
}


