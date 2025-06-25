import { PhysicalWorld, VIEWPORT_ZOOM } from './physics.js';
import { msToSeconds } from './types.js';
import { globalTimers } from './timers.js';
class AnimationLoop {
    constructor(world, gl) {
        this.lastTime = 0;
        this.totalTimer = globalTimers.get('total');
        this.world = world;
        this.gl = gl;
    }
    start() {
        const animate = (currentTime) => {
            this.totalTimer.start();
            const deltaTimeMs = currentTime - this.lastTime;
            const deltaTimeS = msToSeconds(deltaTimeMs);
            this.lastTime = currentTime;
            this.world.step(deltaTimeS);
            render(this.gl);
            this.totalTimer.end();
            globalTimers.logPeriodically();
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }
}
let shaderProgram = null;
let vertexBuffer = null;
let world;
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    if (!shader)
        return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader error:', gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}
function initWebGL(gl) {
    const vertexShaderSource = `
        attribute vec2 a_worldPos;
        uniform vec2 u_viewCenter;
        uniform float u_viewScale;
        uniform float u_invAspectRatio;

        void main() {
            // Transform world coordinates to view coordinates, aspect ratio
            vec2 viewPos = (a_worldPos - u_viewCenter) * u_viewScale;
            viewPos.x *= u_invAspectRatio;

            gl_Position = vec4(viewPos, 0.0, 1.0);
        }
    `;
    const fragmentShaderSource = `
        precision mediump float;
        void main() {
            gl_FragColor = vec4(1.0, 0.5, 0.0, 1.0);
        }
    `;
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vertexShader || !fragmentShader)
        return false;
    shaderProgram = gl.createProgram();
    if (!shaderProgram)
        return false;
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(shaderProgram));
        return false;
    }
    vertexBuffer = gl.createBuffer();
    return true;
}
function render(gl) {
    gl.clearColor(0.1, 0.1, 0.3, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (!shaderProgram || !vertexBuffer)
        return;
    gl.useProgram(shaderProgram);
    // Set uniforms for viewport transformation
    const viewCenterLocation = gl.getUniformLocation(shaderProgram, 'u_viewCenter');
    const viewScaleLocation = gl.getUniformLocation(shaderProgram, 'u_viewScale');
    const invAspectRatioLocation = gl.getUniformLocation(shaderProgram, 'u_invAspectRatio');
    const invAspectRatio = gl.canvas.height / gl.canvas.width;
    gl.uniform2f(viewCenterLocation, 0.0, 0.0); // Camera center
    gl.uniform1f(viewScaleLocation, VIEWPORT_ZOOM); // Zoom level
    gl.uniform1f(invAspectRatioLocation, invAspectRatio);
    const vertexArray = world.getAllTriangleVertices();
    // Update vertex buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.DYNAMIC_DRAW);
    // Set vertex attribute
    const positionLocation = gl.getAttribLocation(shaderProgram, 'a_worldPos');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, world.particles.length * 3);
}
function resizeCanvas(canvas, gl) {
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        console.log('Resize, new dimensions: ', displayWidth, displayHeight);
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, displayWidth, displayHeight);
        render(gl);
    }
}
function main() {
    const canvas = document.getElementById('canvas');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
        console.error('WebGL not supported');
        return;
    }
    console.log('WebGL context initialized successfully');
    if (!initWebGL(gl)) {
        console.error('WebGL initialization failed');
        return;
    }
    world = new PhysicalWorld();
    resizeCanvas(canvas, gl);
    window.addEventListener('resize', () => resizeCanvas(canvas, gl));
    const animationLoop = new AnimationLoop(world, gl);
    animationLoop.start();
}
window.addEventListener('load', main);
