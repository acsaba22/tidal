import { PhysicalWorld, VIEWPORT_ZOOM, setMoonGravity, setMoonDistance, moonGravity, moonDistance } from './physics.js';
import { msToSeconds } from './types.js';
import { globalTimers } from './timers.js';
// Color constants
const BACKGROUND_COLOR = [1.0, 1.0, 1.0, 1.0]; // White
const PARTICLE_COLOR = [0.8, 0.2, 0.0, 1.0]; // Dark red-orange
const AXIS_COLOR = [0.0, 0.0, 0.0, 1.0]; // Black
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
let particleProgram = null;
let lineProgram = null;
let particleBuffer = null;
let lineBuffer = null;
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
    const particleFragmentSource = `
        precision mediump float;
        void main() {
            gl_FragColor = vec4(${PARTICLE_COLOR.join(', ')});
        }
    `;
    const lineFragmentSource = `
        precision mediump float;
        void main() {
            gl_FragColor = vec4(${AXIS_COLOR.join(', ')});
        }
    `;
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const lineVertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const particleFragmentShader = createShader(gl, gl.FRAGMENT_SHADER, particleFragmentSource);
    const lineFragmentShader = createShader(gl, gl.FRAGMENT_SHADER, lineFragmentSource);
    if (!vertexShader || !lineVertexShader || !particleFragmentShader || !lineFragmentShader)
        return false;
    // Create particle program
    particleProgram = gl.createProgram();
    if (!particleProgram)
        return false;
    gl.attachShader(particleProgram, vertexShader);
    gl.attachShader(particleProgram, particleFragmentShader);
    gl.linkProgram(particleProgram);
    if (!gl.getProgramParameter(particleProgram, gl.LINK_STATUS)) {
        console.error('Particle program link error:', gl.getProgramInfoLog(particleProgram));
        return false;
    }
    // Create line program
    lineProgram = gl.createProgram();
    if (!lineProgram)
        return false;
    gl.attachShader(lineProgram, lineVertexShader);
    gl.attachShader(lineProgram, lineFragmentShader);
    gl.linkProgram(lineProgram);
    if (!gl.getProgramParameter(lineProgram, gl.LINK_STATUS)) {
        console.error('Line program link error:', gl.getProgramInfoLog(lineProgram));
        return false;
    }
    particleBuffer = gl.createBuffer();
    lineBuffer = gl.createBuffer();
    // Create bounding box line vertices (-1,-1) to (1,1)
    const boundingBoxVertices = new Float32Array([
        // Left edge: x=-1, y from -1 to 1
        -1, -1, -1, 1,
        // Right edge: x=1, y from -1 to 1  
        1, -1, 1, 1,
        // Bottom edge: y=-1, x from -1 to 1
        -1, -1, 1, -1,
        // Top edge: y=1, x from -1 to 1
        -1, 1, 1, 1
    ]);
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, boundingBoxVertices, gl.STATIC_DRAW);
    return true;
}
function render(gl) {
    gl.clearColor(BACKGROUND_COLOR[0], BACKGROUND_COLOR[1], BACKGROUND_COLOR[2], BACKGROUND_COLOR[3]);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (!particleProgram || !lineProgram || !particleBuffer || !lineBuffer)
        return;
    const invAspectRatio = gl.canvas.height / gl.canvas.width;
    // Draw bounding box lines first
    gl.useProgram(lineProgram);
    const lineViewCenterLocation = gl.getUniformLocation(lineProgram, 'u_viewCenter');
    const lineViewScaleLocation = gl.getUniformLocation(lineProgram, 'u_viewScale');
    const lineInvAspectRatioLocation = gl.getUniformLocation(lineProgram, 'u_invAspectRatio');
    gl.uniform2f(lineViewCenterLocation, 0.0, 0.0);
    gl.uniform1f(lineViewScaleLocation, VIEWPORT_ZOOM);
    gl.uniform1f(lineInvAspectRatioLocation, invAspectRatio);
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
    const linePositionLocation = gl.getAttribLocation(lineProgram, 'a_worldPos');
    gl.enableVertexAttribArray(linePositionLocation);
    gl.vertexAttribPointer(linePositionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINES, 0, 8); // 4 lines * 2 vertices each
    // Draw particles
    gl.useProgram(particleProgram);
    const viewCenterLocation = gl.getUniformLocation(particleProgram, 'u_viewCenter');
    const viewScaleLocation = gl.getUniformLocation(particleProgram, 'u_viewScale');
    const invAspectRatioLocation = gl.getUniformLocation(particleProgram, 'u_invAspectRatio');
    gl.uniform2f(viewCenterLocation, 0.0, 0.0);
    gl.uniform1f(viewScaleLocation, VIEWPORT_ZOOM);
    gl.uniform1f(invAspectRatioLocation, invAspectRatio);
    const vertexArray = world.getAllTriangleVertices();
    gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.DYNAMIC_DRAW);
    const positionLocation = gl.getAttribLocation(particleProgram, 'a_worldPos');
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
function setupSliders() {
    const moonGravitySlider = document.getElementById('moonGravity');
    const moonDistanceSlider = document.getElementById('moonDistance');
    const moonGravityValue = document.getElementById('moonGravityValue');
    const moonDistanceValue = document.getElementById('moonDistanceValue');
    moonGravitySlider.addEventListener('input', () => {
        const sliderValue = parseFloat(moonGravitySlider.value);
        setMoonGravity(sliderValue);
        moonGravityValue.textContent = moonGravity.toFixed(4);
    });
    moonDistanceSlider.addEventListener('input', () => {
        const sliderValue = parseFloat(moonDistanceSlider.value);
        setMoonDistance(sliderValue);
        moonDistanceValue.textContent = Math.round(moonDistance).toString();
    });
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
    setupSliders();
    const animationLoop = new AnimationLoop(world, gl);
    animationLoop.start();
}
window.addEventListener('load', main);
