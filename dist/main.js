"use strict";
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
    // Clear the canvas with a dark blue color
    gl.clearColor(0.1, 0.1, 0.3, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}
// Run when page loads
window.addEventListener('load', main);
