import { Second, smartToString } from './utils.js';
import { globalTimers } from './timers.js';

const PARTICLE_SIZE = 0.05;
const GRID_SIZE = 32; // particle count = GRID_SIZE^2
const GRID_DISTANCE = PARTICLE_SIZE * 2;

const PLANET_GRAVITY = 1.0;
const PRESSURE_STRENGTH = 50.0;
const FORCE_TO_VELOCITY_SCALE = 0.2;


const SHAPE_LOG_INTERVAL_MS = 1000;

const TRIANGLE_SIZE = PARTICLE_SIZE * 0.5;

const REST_DISTANCE = PARTICLE_SIZE * 2;

export const VIEWPORT_ZOOM = 0.4;

const PARTICLE_LOG_FREQUENCY = 1e10; // 1e5 is ~1.5s ; 1e10 never

export const SLIDER_SCALE = 50;

export class SimulationConstant {
    min: number;
    value: number;
    max: number;
    linear: boolean; // logarithmic otherwise

    constructor(min: number, value: number, max: number, linear: boolean = false) {
        this.min = min;
        this.value = value;
        this.max = max;
        this.linear = linear;
    }

    setValue(sliderValue: number): void {
        this.value = this.linear ?
            linearScale(sliderValue, this.min, this.max) :
            logarithmicScale(sliderValue, this.min, this.max);
        updateMoonParams();
    }
}

export const moonMass = new SimulationConstant(0.001, 0.01, 10.0);
export const moonStrengthDistance = new SimulationConstant(2, 60, 2000);
export const moonPointingDistance = new SimulationConstant(2, 60, 2000);
export const rotationCenterDistance = new SimulationConstant(0.1, 0.74, 50);
export const pointiness = new SimulationConstant(-1, 2.0, 10, true);



// Triangle pointing mode: M=moon, C=centrifugal, E=earth, MC=moon+centrifugal, MCE=all
export let pointingMode = 'MC';

const physicsTimer = globalTimers.get('worldStep');

export function updateMoonParams(): void {
    // console.log(`Moon params: mass=${moonMass.value.toFixed(2)}, strengthDist=${moonStrengthDistance.value.toFixed(1)}, pointingDist=${moonPointingDistance.value.toFixed(1)}, rotationCenter=${rotationCenterDistance.value.toFixed(1)}`);
}

function logarithmicScale(sliderValue: number, min: number, max: number): number {
    return min * Math.pow(max / min, sliderValue / SLIDER_SCALE);
}

function linearScale(sliderValue: number, min: number, max: number): number {
    return min + (max - min) * (sliderValue / SLIDER_SCALE);
}

export function valueToSliderPosition(value: number, min: number, max: number): number {
    return SLIDER_SCALE * Math.log(value / min) / Math.log(max / min);
}

export function valueToLinearSliderPosition(value: number, min: number, max: number): number {
    return SLIDER_SCALE * (value - min) / (max - min);
}


export function setPointingMode(mode: string): void {
    pointingMode = mode;
}

export class Coor {
    constructor(public x: number, public y: number) {}

    add(other: Coor): Coor { return new Coor(this.x + other.x, this.y + other.y); }
    subtract(other: Coor): Coor { return new Coor(this.x - other.x, this.y - other.y); }
    multiply(scalar: number): Coor { return new Coor(this.x * scalar, this.y * scalar); }
    distance(): number { return Math.sqrt(this.x * this.x + this.y * this.y); }
    distanceTo(other: Coor): number { return this.subtract(other).distance(); }
    normalize(): Coor { const d = this.distance(); return d > 0 ? this.multiply(1/d) : new Coor(0, 0); }

    addInPlace(other: Coor): void { this.x += other.x; this.y += other.y; }
    subtractInPlace(other: Coor): void { this.x -= other.x; this.y -= other.y; }
    multiplyInPlace(scalar: number): void { this.x *= scalar; this.y *= scalar; }

    toString(): string { return `(${this.x.toFixed(3)}, ${this.y.toFixed(3)})`; }
}

export class Particle {
    public position: Coor;
    public force: Coor = new Coor(0, 0);
    public gravityForce: Coor = new Coor(0, 0);
    public pressureForce: Coor = new Coor(0, 0);
    public moonGravityForce: Coor = new Coor(0, 0);
    public centrifugalForce: Coor = new Coor(0, 0);

    constructor(x: number, y: number) {
        this.position = new Coor(x, y);
    }

    calculateGravityForce(): void {
        this.gravityForce = this.position.multiply(-PLANET_GRAVITY);
    }

    clearPressureForce(): void {
        this.pressureForce = new Coor(0, 0);
    }

    calculateMoonGravityForce(): void {
        const moonStrengthPosition = new Coor(moonStrengthDistance.value, 0);
        const strengthDiff = moonStrengthPosition.subtract(this.position);
        const strengthDistance = strengthDiff.distance();

        if (strengthDistance > 0) {
            const forceMagnitude = moonMass.value / (strengthDistance * strengthDistance);

            const moonPointingPosition = new Coor(moonPointingDistance.value, 0);
            const pointingDiff = moonPointingPosition.subtract(this.position);
            this.moonGravityForce = pointingDiff.normalize().multiply(forceMagnitude);
        } else {
            this.moonGravityForce = new Coor(0, 0);
        }
    }

    calculateCentrifugalForce(): void {
        // Centrifugal force from rotation center point (top view)
        const rotationCenter = new Coor(rotationCenterDistance.value, 0);
        this.centrifugalForce = this.position.subtract(rotationCenter);
    }

    sumUpForces(): void {
        this.force = this.gravityForce.add(this.pressureForce);
        this.force.addInPlace(this.moonGravityForce);
        this.force.addInPlace(this.centrifugalForce);

        if (Math.random() < 1 / PARTICLE_LOG_FREQUENCY) {
            const tidalForce = this.moonGravityForce.add(this.centrifugalForce).distance();
            console.log(`Particle at ${this.position.toString()}: gravity=${this.gravityForce.distance().toExponential(2)}, moon=${this.moonGravityForce.distance().toExponential(2)}, centrifugal=${this.centrifugalForce.distance().toExponential(2)}, tidal=${tidalForce.toExponential(2)}`);
        }
    }

    moveByForce(deltaTime: Second): void {
        this.position.x += this.force.x * deltaTime * FORCE_TO_VELOCITY_SCALE;
        this.position.y += this.force.y * deltaTime * FORCE_TO_VELOCITY_SCALE;
    }

    getTriangleVertices(): number[] {
        let pointingForce = new Coor(0, 0);

        if (pointingMode.includes('M')) pointingForce.addInPlace(this.moonGravityForce);
        if (pointingMode.includes('C')) pointingForce.addInPlace(this.centrifugalForce);
        if (pointingMode.includes('E')) pointingForce.addInPlace(this.gravityForce);

        const forceLength = pointingForce.distance();

        if (forceLength === 0) {
            // Default upward triangle with equal sides (aspect ratio 1.0)
            return [
                this.position.x, this.position.y + TRIANGLE_SIZE,
                this.position.x - TRIANGLE_SIZE, this.position.y - TRIANGLE_SIZE,
                this.position.x + TRIANGLE_SIZE, this.position.y - TRIANGLE_SIZE
            ];
        }

        // Normalize force direction
        const direction = pointingForce.multiply(1 / forceLength);

        // Calculate triangle vertices pointing in force direction
        const aspectRatio = 1.0 + forceLength * Math.pow(10, pointiness.value);
        const halfWidth = TRIANGLE_SIZE / aspectRatio;
        const height = TRIANGLE_SIZE;

        // Tip point (in force direction)
        const tip = this.position.add(direction.multiply(height));

        // Base points (perpendicular to force direction)
        const perpendicular = new Coor(-direction.y, direction.x);
        const baseCenter = this.position.subtract(direction.multiply(height));
        const base1 = baseCenter.add(perpendicular.multiply(halfWidth));
        const base2 = baseCenter.subtract(perpendicular.multiply(halfWidth));

        return [tip.x, tip.y, base1.x, base1.y, base2.x, base2.y];
    }
}

function addPressureForceBetween(p1: Particle, p2: Particle): void {
    const diff = p2.position.subtract(p1.position);
    const distance = diff.distance();

    if (distance < REST_DISTANCE && distance > 0) {
        const overlap = REST_DISTANCE - distance;
        const forceMagnitude = PRESSURE_STRENGTH * overlap;
        const forceDirection = diff.multiply(1 / distance);
        const force = forceDirection.multiply(forceMagnitude);

        p1.pressureForce.subtractInPlace(force);
        p2.pressureForce.addInPlace(force);
    }
}

export class PhysicalWorld {
    public particles: Particle[] = [];
    private lastShapeLogTime = 0;
    private shapeDiffAvg = 0;
    private meanXAvg = 0;
    private shapeCheckCount = 0;

    constructor() {
        this.initializeGrid();
    }

    private initializeGrid(): void {
        const startOffset = -(GRID_SIZE - 1) * GRID_DISTANCE * 0.5;

        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const x = startOffset + col * GRID_DISTANCE;
                const y = startOffset + row * GRID_DISTANCE;
                this.particles.push(new Particle(x, y));
            }
        }
    }

    calculatePressureForces(): void {
        for (const particle of this.particles) {
            particle.clearPressureForce();
        }

        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                addPressureForceBetween(this.particles[i], this.particles[j]);
            }
        }
    }

    scaleCentrifugalForces(): void {
        let totalMoonGravity = new Coor(0, 0);
        let totalCentrifugal = new Coor(0, 0);
        
        for (const particle of this.particles) {
            totalMoonGravity.addInPlace(particle.moonGravityForce);
            totalCentrifugal.addInPlace(particle.centrifugalForce);
        }

        const totalCentrifugalMagnitude = totalCentrifugal.distance();
        if (totalCentrifugalMagnitude > 0) {
            const scalingFactor = totalMoonGravity.distance() / totalCentrifugalMagnitude;
            for (const particle of this.particles) {
                particle.centrifugalForce.multiplyInPlace(scalingFactor);
            }
        }
    }

    calculateForces(): void {
        this.calculatePressureForces();

        for (const particle of this.particles) {
            particle.calculateGravityForce();
            particle.calculateMoonGravityForce();
            particle.calculateCentrifugalForce();
        }

        this.scaleCentrifugalForces();

        for (const particle of this.particles) {
            particle.sumUpForces();
        }
    }

    getAllTriangleVertices(): Float32Array {
        const vertices: number[] = [];
        for (const particle of this.particles) {
            const triangleVertices = particle.getTriangleVertices();
            vertices.push(...triangleVertices);
        }
        return new Float32Array(vertices);
    }

    checkShape(): void {
        // Calculate current values
        let meanX = 0, meanY = 0;
        for (const particle of this.particles) {
            meanX += particle.position.x;
            meanY += particle.position.y;
        }
        meanX /= this.particles.length;
        meanY /= this.particles.length;

        // Calculate RMS from mean
        let sumXSq = 0, sumYSq = 0;
        for (const particle of this.particles) {
            const dx = particle.position.x - meanX;
            const dy = particle.position.y - meanY;
            sumXSq += dx * dx;
            sumYSq += dy * dy;
        }
        const rmsX = Math.sqrt(sumXSq / this.particles.length);
        const rmsY = Math.sqrt(sumYSq / this.particles.length);
        const shapeDiff = rmsX - rmsY;

        // Update running averages
        this.shapeCheckCount++;
        this.shapeDiffAvg = (this.shapeDiffAvg * (this.shapeCheckCount - 1) + shapeDiff) / this.shapeCheckCount;
        this.meanXAvg = (this.meanXAvg * (this.shapeCheckCount - 1) + meanX) / this.shapeCheckCount;
    }

    logShapePeriodically(): void {
        const now = performance.now();
        if (now - this.lastShapeLogTime >= SHAPE_LOG_INTERVAL_MS) {
            console.log(`Shape: shapeDiff=${smartToString(this.shapeDiffAvg)}, meanX=${smartToString(this.meanXAvg)}`);

            // Update UI display
            const shapeMetricElement = document.getElementById('shapeMetric');
            if (shapeMetricElement) {
                shapeMetricElement.textContent = smartToString(this.shapeDiffAvg);
            }

            // Reset for next period
            this.shapeDiffAvg = 0;
            this.meanXAvg = 0;
            this.shapeCheckCount = 0;
            this.lastShapeLogTime = now;
        }
    }

    step(deltaTime: Second): void {
        physicsTimer.start();

        this.calculateForces();

        for (const particle of this.particles) {
            particle.moveByForce(deltaTime);
        }

        this.checkShape();
        this.logShapePeriodically();

        physicsTimer.end();
    }
}