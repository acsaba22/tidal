"use strict";
let shaderProgram = null;
let vertexBuffer = null;
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
        attribute vec2 a_position;
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
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
    // Triangle vertices
    const vertices = new Float32Array([
        0.0, 0.1, // Top
        -0.05, -0.1, // Bottom left
        0.05, -0.1 // Bottom right
    ]);
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    return true;
}
function render(gl) {
    gl.clearColor(0.1, 0.1, 0.3, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (!shaderProgram || !vertexBuffer)
        return;
    gl.useProgram(shaderProgram);
    const positionLocation = gl.getAttribLocation(shaderProgram, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
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
    resizeCanvas(canvas, gl);
    window.addEventListener('resize', () => resizeCanvas(canvas, gl));
}
window.addEventListener('load', main);
