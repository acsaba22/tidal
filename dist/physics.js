import { globalTimers } from './timers.js';
const PARTICLE_SIZE = 0.06;
const GRID_SIZE = 32; // particle count = GRID_SIZE^2
const GRID_DISTANCE = PARTICLE_SIZE * 2;
const PLANET_GRAVITY = 1.0;
const PRESSURE_STRENGTH = 20.0;
const FORCE_TO_VELOCITY_SCALE = 0.3;
export const SLIDER_SCALE = 50;
export class SimulationConstant {
    constructor(min, value, max, linear = false) {
        this.min = min;
        this.value = value;
        this.max = max;
        this.linear = linear;
    }
    setValue(sliderValue) {
        this.value = this.linear ?
            linearScale(sliderValue, this.min, this.max) :
            logarithmicScale(sliderValue, this.min, this.max);
        updateMoonParams();
    }
}
export const moonMass = new SimulationConstant(0.001, 2.0, 10.0);
export const moonStrengthDistance = new SimulationConstant(5, 60, 2000);
export const moonPointingDistance = new SimulationConstant(5, 60, 2000);
export const rotationCenterDistance = new SimulationConstant(0.1, 5.0, 50);
export const pointiness = new SimulationConstant(-1, 1.0, 10, true);
const PARTICLE_LOG_FREQUENCY = 1e10; // 1e5 is ~1.5s ; 1e10 never
const SHAPE_LOG_INTERVAL_MS = 1000;
const TRIANGLE_SIZE = PARTICLE_SIZE * 0.5;
const REST_DISTANCE = PARTICLE_SIZE * 2;
export const VIEWPORT_ZOOM = 0.4;
export let moonGravityMagnitudeAtOrigo = 0;
// Triangle pointing mode: M=moon, C=centrifugal, E=earth, MC=moon+centrifugal, MCE=all
export let pointingMode = 'MC';
const physicsTimer = globalTimers.get('worldStep');
function updateMoonParams() {
    // Calculate moon gravity magnitude at origin (0,0)
    moonGravityMagnitudeAtOrigo = moonMass.value / (moonStrengthDistance.value * moonStrengthDistance.value);
    // console.log(`Moon params: mass=${moonMass.value.toFixed(2)}, strengthDist=${moonStrengthDistance.value.toFixed(1)}, pointingDist=${moonPointingDistance.value.toFixed(1)}, rotationCenter=${rotationCenterDistance.value.toFixed(1)}, gravityAtOrigo=${moonGravityMagnitudeAtOrigo.toExponential(2)}`);
}
function logarithmicScale(sliderValue, min, max) {
    return min * Math.pow(max / min, sliderValue / SLIDER_SCALE);
}
function linearScale(sliderValue, min, max) {
    return min + (max - min) * (sliderValue / SLIDER_SCALE);
}
export function valueToSliderPosition(value, min, max) {
    return SLIDER_SCALE * Math.log(value / min) / Math.log(max / min);
}
export function valueToLinearSliderPosition(value, min, max) {
    return SLIDER_SCALE * (value - min) / (max - min);
}
export function setPointingMode(mode) {
    pointingMode = mode;
}
export class Coor {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    add(other) { return new Coor(this.x + other.x, this.y + other.y); }
    subtract(other) { return new Coor(this.x - other.x, this.y - other.y); }
    multiply(scalar) { return new Coor(this.x * scalar, this.y * scalar); }
    distance() { return Math.sqrt(this.x * this.x + this.y * this.y); }
    distanceTo(other) { return this.subtract(other).distance(); }
    normalize() { const d = this.distance(); return d > 0 ? this.multiply(1 / d) : new Coor(0, 0); }
    addInPlace(other) { this.x += other.x; this.y += other.y; }
    subtractInPlace(other) { this.x -= other.x; this.y -= other.y; }
    multiplyInPlace(scalar) { this.x *= scalar; this.y *= scalar; }
    toString() { return `(${this.x.toFixed(3)}, ${this.y.toFixed(3)})`; }
}
export class Particle {
    constructor(x, y) {
        this.force = new Coor(0, 0);
        this.gravityForce = new Coor(0, 0);
        this.pressureForce = new Coor(0, 0);
        this.moonGravityForce = new Coor(0, 0);
        this.centrifugalForce = new Coor(0, 0);
        this.position = new Coor(x, y);
    }
    calculateGravityForce() {
        this.gravityForce = this.position.multiply(-PLANET_GRAVITY);
    }
    clearPressureForce() {
        this.pressureForce = new Coor(0, 0);
    }
    calculateMoonGravityForce() {
        const moonStrengthPosition = new Coor(moonStrengthDistance.value, 0);
        const strengthDiff = moonStrengthPosition.subtract(this.position);
        const strengthDistance = strengthDiff.distance();
        if (strengthDistance > 0) {
            const forceMagnitude = moonMass.value / (strengthDistance * strengthDistance);
            const moonPointingPosition = new Coor(moonPointingDistance.value, 0);
            const pointingDiff = moonPointingPosition.subtract(this.position);
            this.moonGravityForce = pointingDiff.normalize().multiply(forceMagnitude);
        }
        else {
            this.moonGravityForce = new Coor(0, 0);
        }
    }
    calculateCentrifugalForce() {
        // Centrifugal force only in x-direction, linear from center
        const xDistanceFromCenter = this.position.x - rotationCenterDistance.value;
        const forceMagnitude = moonGravityMagnitudeAtOrigo * xDistanceFromCenter / rotationCenterDistance.value;
        this.centrifugalForce = new Coor(forceMagnitude, 0);
    }
    sumUpForces() {
        this.force = this.gravityForce.add(this.pressureForce);
        this.force.addInPlace(this.moonGravityForce);
        this.force.addInPlace(this.centrifugalForce);
        if (Math.random() < 1 / PARTICLE_LOG_FREQUENCY) {
            const tidalForce = this.moonGravityForce.add(this.centrifugalForce).distance();
            console.log(`Particle at ${this.position.toString()}: gravity=${this.gravityForce.distance().toExponential(2)}, moon=${this.moonGravityForce.distance().toExponential(2)}, centrifugal=${this.centrifugalForce.distance().toExponential(2)}, tidal=${tidalForce.toExponential(2)}`);
        }
    }
    moveByForce(deltaTime) {
        this.position.x += this.force.x * deltaTime * FORCE_TO_VELOCITY_SCALE;
        this.position.y += this.force.y * deltaTime * FORCE_TO_VELOCITY_SCALE;
    }
    getTriangleVertices() {
        let pointingForce = new Coor(0, 0);
        if (pointingMode.includes('M'))
            pointingForce.addInPlace(this.moonGravityForce);
        if (pointingMode.includes('C'))
            pointingForce.addInPlace(this.centrifugalForce);
        if (pointingMode.includes('E'))
            pointingForce.addInPlace(this.gravityForce);
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
function addPressureForceBetween(p1, p2) {
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
    constructor() {
        this.particles = [];
        this.lastShapeLogTime = 0;
        this.shapeDiffAvg = 0;
        this.meanXAvg = 0;
        this.shapeCheckCount = 0;
        this.initializeGrid();
    }
    initializeGrid() {
        const startOffset = -(GRID_SIZE - 1) * GRID_DISTANCE * 0.5;
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const x = startOffset + col * GRID_DISTANCE;
                const y = startOffset + row * GRID_DISTANCE;
                this.particles.push(new Particle(x, y));
            }
        }
    }
    calculatePressureForces() {
        for (const particle of this.particles) {
            particle.clearPressureForce();
        }
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                addPressureForceBetween(this.particles[i], this.particles[j]);
            }
        }
    }
    calculateForces() {
        this.calculatePressureForces();
        for (const particle of this.particles) {
            particle.calculateGravityForce();
            particle.calculateMoonGravityForce();
            particle.calculateCentrifugalForce();
            particle.sumUpForces();
        }
    }
    getAllTriangleVertices() {
        const vertices = [];
        for (const particle of this.particles) {
            const triangleVertices = particle.getTriangleVertices();
            vertices.push(...triangleVertices);
        }
        return new Float32Array(vertices);
    }
    checkShape() {
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
    logShapePeriodically() {
        const now = performance.now();
        if (now - this.lastShapeLogTime >= SHAPE_LOG_INTERVAL_MS) {
            console.log(`Shape: shapeDiff=${this.shapeDiffAvg.toExponential(2)}, meanX=${this.meanXAvg.toExponential(2)}`);
            // Update UI display
            const shapeMetricElement = document.getElementById('shapeMetric');
            if (shapeMetricElement) {
                shapeMetricElement.textContent = this.shapeDiffAvg.toExponential(2);
            }
            // Reset for next period
            this.shapeDiffAvg = 0;
            this.meanXAvg = 0;
            this.shapeCheckCount = 0;
            this.lastShapeLogTime = now;
        }
    }
    step(deltaTime) {
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
