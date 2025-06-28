import * as Physics from './physics.js';
import { Millisecond, Second, msToSeconds } from './types.js';
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

function setupSliders(): void {
    const moonMassSlider = document.getElementById('moonMass') as HTMLInputElement;
    const moonStrengthDistanceSlider = document.getElementById('moonStrengthDistance') as HTMLInputElement;
    const moonPointingDistanceSlider = document.getElementById('moonPointingDistance') as HTMLInputElement;
    const rotationCenterDistanceSlider = document.getElementById('rotationCenterDistance') as HTMLInputElement;
    const pointinessSlider = document.getElementById('pointiness') as HTMLInputElement;
    
    // Set slider ranges from constant
    [moonMassSlider, moonStrengthDistanceSlider, moonPointingDistanceSlider, rotationCenterDistanceSlider, pointinessSlider].forEach(slider => {
        slider.max = Physics.SLIDER_SCALE.toString();
        slider.value = (Physics.SLIDER_SCALE / 2).toString();
    });
    
    // Set all sliders to match current values
    moonMassSlider.value = Physics.valueToSliderPosition(Physics.moonMass, Physics.MOON_MASS_MIN, Physics.MOON_MASS_MAX).toString();
    moonStrengthDistanceSlider.value = Physics.valueToSliderPosition(Physics.moonStrengthDistance, Physics.MOON_STRENGTH_DISTANCE_MIN, Physics.MOON_STRENGTH_DISTANCE_MAX).toString();
    moonPointingDistanceSlider.value = Physics.valueToSliderPosition(Physics.moonPointingDistance, Physics.MOON_POINTING_DISTANCE_MIN, Physics.MOON_POINTING_DISTANCE_MAX).toString();
    rotationCenterDistanceSlider.value = Physics.valueToSliderPosition(Physics.rotationCenterDistance, Physics.ROTATION_CENTER_DISTANCE_MIN, Physics.ROTATION_CENTER_DISTANCE_MAX).toString();
    pointinessSlider.value = Physics.valueToLinearSliderPosition(Physics.pointiness, Physics.POINTINESS_MIN, Physics.POINTINESS_MAX).toString();
    
    const moonMassValue = document.getElementById('moonMassValue') as HTMLSpanElement;
    const moonStrengthDistanceValue = document.getElementById('moonStrengthDistanceValue') as HTMLSpanElement;
    const moonPointingDistanceValue = document.getElementById('moonPointingDistanceValue') as HTMLSpanElement;
    const rotationCenterDistanceValue = document.getElementById('rotationCenterDistanceValue') as HTMLSpanElement;
    const pointinessValue = document.getElementById('pointinessValue') as HTMLSpanElement;

    moonMassSlider.addEventListener('input', () => {
        const sliderValue = parseFloat(moonMassSlider.value);
        Physics.setMoonMass(sliderValue);
        moonMassValue.textContent = Physics.moonMass.toFixed(2);
    });

    moonStrengthDistanceSlider.addEventListener('input', () => {
        const sliderValue = parseFloat(moonStrengthDistanceSlider.value);
        Physics.setMoonStrengthDistance(sliderValue);
        moonStrengthDistanceValue.textContent = Math.round(Physics.moonStrengthDistance).toString();
    });

    moonPointingDistanceSlider.addEventListener('input', () => {
        const sliderValue = parseFloat(moonPointingDistanceSlider.value);
        Physics.setMoonPointingDistance(sliderValue);
        moonPointingDistanceValue.textContent = Math.round(Physics.moonPointingDistance).toString();
    });

    rotationCenterDistanceSlider.addEventListener('input', () => {
        const sliderValue = parseFloat(rotationCenterDistanceSlider.value);
        Physics.setRotationCenterDistance(sliderValue);
        rotationCenterDistanceValue.textContent = Physics.rotationCenterDistance.toFixed(1);
    });

    pointinessSlider.addEventListener('input', () => {
        const sliderValue = parseFloat(pointinessSlider.value);
        Physics.setPointiness(sliderValue);
        pointinessValue.textContent = Physics.pointiness.toFixed(1);
    });

    // Setup radio buttons
    const pointingRadios = document.querySelectorAll('input[name="pointing"]');
    pointingRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            if (target.checked) {
                Physics.setPointingMode(target.value);
            }
        });
    });

    // Trigger initial update
    moonMassSlider.dispatchEvent(new Event('input'));
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

    setupSliders();

    const animationLoop = new AnimationLoop(world, gl);
    animationLoop.start();
}

window.addEventListener('load', main);