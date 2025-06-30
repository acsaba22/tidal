import * as Physics from './physics.js';
import { Millisecond, Second, msToSeconds, smartToString } from './utils.js';
import * as Timers from './timers.js';
import * as Renderer from './renderer.js';

class AnimationLoop {
    private lastTime: Millisecond = 0;
    private world: Physics.PhysicalWorld;
    private gl: WebGLRenderingContext;
    private totalTimer = Timers.globalTimers.get('total');

    constructor(world: Physics.PhysicalWorld, gl: WebGLRenderingContext) {
        this.world = world;
        this.gl = gl;
    }

    start(): void {
        const animate = (currentTime: Millisecond): void => {
            this.totalTimer.start();
            
            const deltaTimeMs = currentTime - this.lastTime;
            const deltaTimeS = msToSeconds(deltaTimeMs);
            this.lastTime = currentTime;

            this.world.step(deltaTimeS);
            Renderer.render(this.gl, this.world);
            
            this.totalTimer.end();
            Timers.globalTimers.logPeriodically();
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }
}

let world: Physics.PhysicalWorld;

function resizeCanvas(canvas: HTMLCanvasElement, gl: WebGLRenderingContext): void {
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        console.log('Resize, new dimensions: ', displayWidth, displayHeight);
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, displayWidth, displayHeight);
        Renderer.render(gl, world);
    }
}

function createSlider(id: string, label: string, param: Physics.SimulationConstant): void {
    const container = document.getElementById('controls-container');
    if (!container) return;
    
    const controlGroup = document.createElement('div');
    controlGroup.className = 'control-group';
    
    const sliderPosition = param.linear ? 
        Physics.valueToLinearSliderPosition(param.value, param.min, param.max) :
        Physics.valueToSliderPosition(param.value, param.min, param.max);
    
    controlGroup.innerHTML = `
        <label for="${id}">${label}: <span id="${id}Value" class="value-display"></span></label>
        <input type="range" id="${id}" min="0" max="${Physics.SLIDER_SCALE}" step="1" value="${sliderPosition}">
    `;
    
    container.insertBefore(controlGroup, container.lastElementChild);
    
    const slider = document.getElementById(id) as HTMLInputElement;
    const valueDisplay = document.getElementById(id + 'Value') as HTMLSpanElement;
    
    slider.addEventListener('input', () => {
        const sliderValue = parseFloat(slider.value);
        param.setValue(sliderValue);
        valueDisplay.textContent = smartToString(param.value);
    });
    
    valueDisplay.textContent = smartToString(param.value);
}

function createSliders(): void {
    createSlider('moonMass', 'Moon Mass', Physics.moonMass);
    createSlider('moonStrengthDistance', 'Strength Distance', Physics.moonStrengthDistance);
    createSlider('moonPointingDistance', 'Pointing Distance', Physics.moonPointingDistance);
    createSlider('rotationCenterDistance', 'Rotation Center', Physics.rotationCenterDistance);
    createSlider('pointiness', 'Pointiness', Physics.pointiness);
}

function setupPointing(): void {
    const pointingRadios = document.querySelectorAll('input[name="pointing"]');
    pointingRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            if (target.checked) {
                Physics.setPointingMode(target.value);
            }
        });
    });

    const sideViewCheckbox = document.getElementById('sideView') as HTMLInputElement;
    sideViewCheckbox.addEventListener('change', () => {
        Physics.setSideView(sideViewCheckbox.checked);
    });
}

function main(): void {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
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

    if (!Renderer.initWebGL(gl)) {
        console.error('WebGL initialization failed');
        return;
    }

    world = new Physics.PhysicalWorld();

    resizeCanvas(canvas, gl);
    window.addEventListener('resize', () => resizeCanvas(canvas, gl));

    createSliders();
    Physics.updateMoonParams();
    setupPointing();

    const animationLoop = new AnimationLoop(world, gl);
    animationLoop.start();
}

window.addEventListener('load', main);