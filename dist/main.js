"use strict";
function resizeCanvas(canvas, gl) {
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        console.log('Resize, new dimensions: ', displayWidth, displayHeight);
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, displayWidth, displayHeight);
        gl.clearColor(0.1, 0.1, 0.3, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
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
    console.log('WebGL version:', gl.getParameter(gl.VERSION));
    console.log('Renderer:', gl.getParameter(gl.RENDERER));
    resizeCanvas(canvas, gl);
    window.addEventListener('resize', () => resizeCanvas(canvas, gl));
}
window.addEventListener('load', main);
