import { Second } from './types.js';
import { globalTimers } from './timers.js';

const PARTICLE_SIZE = 0.06;
const GRID_SIZE = 32; // particle count = GRID_SIZE^2
const GRID_DISTANCE = PARTICLE_SIZE * 2;

const PLANET_GRAVITY = 1.0;
const PRESSURE_STRENGTH = 20.0;
const FORCE_TO_VELOCITY_SCALE = 0.3;

const SLIDER_SCALE = 10;
const MOON_MASS_MIN = 0.001;
const MOON_MASS_MAX = 10.0;
const MOON_STRENGTH_DISTANCE_MIN = 5;
const MOON_STRENGTH_DISTANCE_MAX = 2000;
const MOON_POINTING_DISTANCE_MIN = 5;
const MOON_POINTING_DISTANCE_MAX = 2000;
const ROTATION_CENTER_DISTANCE_MIN = 0.1;
const ROTATION_CENTER_DISTANCE_MAX = 50;

const PARTICLE_LOG_FREQUENCY = 1e10; // 1e5 is ~1.5s ; 1e10 never

const TRIANGLE_SIZE = PARTICLE_SIZE * 0.5;
const FORCE_TO_POINTINESS = 10.0;

const REST_DISTANCE = PARTICLE_SIZE * 2;

export const VIEWPORT_ZOOM = 0.5;


export let moonMass = 1.0;
export let moonStrengthDistance = 60;
export let moonPointingDistance = 60;
export let rotationCenterDistance = 5.0;
export let moonGravityMagnitudeAtOrigo = 0;

const physicsTimer = globalTimers.get('worldStep');

function updateMoonParams(): void {
    // Calculate moon gravity magnitude at origin (0,0)
    moonGravityMagnitudeAtOrigo = moonMass / (moonStrengthDistance * moonStrengthDistance);

    console.log(`Moon params: mass=${moonMass.toFixed(2)}, strengthDist=${moonStrengthDistance.toFixed(1)}, pointingDist=${moonPointingDistance.toFixed(1)}, rotationCenter=${rotationCenterDistance.toFixed(1)}, gravityAtOrigo=${moonGravityMagnitudeAtOrigo.toExponential(2)}`);
}

function logarithmicScale(sliderValue: number, min: number, max: number): number {
    return min * Math.pow(max / min, sliderValue / SLIDER_SCALE);
}

export function setMoonMass(sliderValue: number): void {
    moonMass = logarithmicScale(sliderValue, MOON_MASS_MIN, MOON_MASS_MAX);
    updateMoonParams();
}

export function setMoonStrengthDistance(sliderValue: number): void {
    moonStrengthDistance = logarithmicScale(sliderValue, MOON_STRENGTH_DISTANCE_MIN, MOON_STRENGTH_DISTANCE_MAX);
    updateMoonParams();
}

export function setMoonPointingDistance(sliderValue: number): void {
    moonPointingDistance = logarithmicScale(sliderValue, MOON_POINTING_DISTANCE_MIN, MOON_POINTING_DISTANCE_MAX);
    updateMoonParams();
}

export function setRotationCenterDistance(sliderValue: number): void {
    rotationCenterDistance = logarithmicScale(sliderValue, ROTATION_CENTER_DISTANCE_MIN, ROTATION_CENTER_DISTANCE_MAX);
    updateMoonParams();
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
        const moonStrengthPosition = new Coor(moonStrengthDistance, 0);
        const strengthDiff = moonStrengthPosition.subtract(this.position);
        const strengthDistance = strengthDiff.distance();

        if (strengthDistance > 0) {
            const forceMagnitude = moonMass / (strengthDistance * strengthDistance);

            const moonPointingPosition = new Coor(moonPointingDistance, 0);
            const pointingDiff = moonPointingPosition.subtract(this.position);
            this.moonGravityForce = pointingDiff.normalize().multiply(forceMagnitude);
        } else {
            this.moonGravityForce = new Coor(0, 0);
        }
    }

    calculateCentrifugalForce(): void {
        // Centrifugal force only in x-direction, linear from center
        const xDistanceFromCenter = this.position.x - rotationCenterDistance;
        const forceMagnitude = moonGravityMagnitudeAtOrigo * xDistanceFromCenter / rotationCenterDistance;
        this.centrifugalForce = new Coor(forceMagnitude, 0);
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
        const pointingForce: Coor = this.moonGravityForce.add(this.centrifugalForce);
        // const pointingForce: Coor = this.centrifugalForce;

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
        const aspectRatio = 1.0 + forceLength * FORCE_TO_POINTINESS;
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

    calculateForces(): void {
        this.calculatePressureForces();

        for (const particle of this.particles) {
            particle.calculateGravityForce();
            particle.calculateMoonGravityForce();
            particle.calculateCentrifugalForce();
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

    step(deltaTime: Second): void {
        physicsTimer.start();

        this.calculateForces();

        for (const particle of this.particles) {
            particle.moveByForce(deltaTime);
        }

        physicsTimer.end();
    }
}