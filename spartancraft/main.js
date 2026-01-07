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


// shaders
const shaderCode = `
@vertex
fn vsMain(@location(0) position: vec2f) -> @builtin(position) vec4f {
    return vec4f(position, 0.0, 1.0);
}


@fragment
fn fsMain() -> @location(0) vec4f {
    return vec4f(0.2, 0.9, 0.2, 1.0);
}
`;

const shaderModule = device.createShaderModule({ code: shaderCode });


const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
        module: shaderModule,
        entryPoint: "vsMain",
        buffers: [
            {
                arrayStride: 8,
                attributes: [
                    { shaderLocation: 0, offset: 0, format: "float32x2" },
                ],
            },
        ],
    },
    fragment: {
        module: shaderModule,
        entryPoint: "fsMain",
        targets: [{ format }],
    },
    primative: {
        topology: "triangle-list",
    },
});

const vertexData = new Float32Array([
    0.0, 0.5,
    -0.5, -0.5,
    0.5, -0.5,
]);


const vertexBuffer = device.createBuffer({
    size: vertexData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(vertexBuffer, 0, vertexData);

function frame() {
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
    });

    pass.setPipeline(pipeline);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.draw(3);

    pass.end();

    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);

    requestAnimationFrame(frame);
}


requestAnimationFrame(frame);