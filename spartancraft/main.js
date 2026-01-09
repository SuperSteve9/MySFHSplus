

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



// shaders
const shaderCode = `
struct Uniforms {
    m: mat4x4f,
};

@group(0) @binding(0) var<uniform> uni: Uniforms;

@vertex
fn vsMain(@location(0) position: vec3f) -> @builtin(position) vec4f {
    return uni.m * vec4f(position, 1.0);
}


@fragment
fn fsMain() -> @location(0) vec4f {
    return vec4f(0.2, 0.9, 0.2, 1.0);
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
                arrayStride: 12,
                attributes: [
                    { shaderLocation: 0, offset: 0, format: "float32x3" },
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

// MESS WITH THIS
const vertexData = new Float32Array([
  -0.5, -0.5, -0.5,
   0.5, -0.5, -0.5,
   0.5,  0.5, -0.5,
  -0.5,  0.5, -0.5,
  -0.5, -0.5,  0.5,
   0.5, -0.5,  0.5,
   0.5,  0.5,  0.5,
  -0.5,  0.5,  0.5, 
]);


const indexData = new Uint16Array([
    0, 1, 2, 0, 2, 3,
    4, 6, 5, 4, 7, 6,
    4, 5, 1, 4, 1, 0,
    3, 2, 6, 3, 6, 7,
    4, 0, 3, 4, 3, 7,
    1, 5, 6, 1, 6, 2,
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
