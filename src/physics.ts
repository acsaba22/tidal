import { Second } from './types.js';
import { globalTimers } from './timers.js';

const physicsTimer = globalTimers.get('worldStep');

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
}

const PARTICLE_SIZE = 0.01;
const GRID_DISTANCE = PARTICLE_SIZE * 2;
const GRID_SIZE = 10;
const PLANET_GRAVITY = 1.0;
const TRIANGLE_SIZE = PARTICLE_SIZE * 0.5;
const TRIANGLE_ASPECT_RATIO = 2.0;
const FORCE_POINTINESS_SCALE = 10.0;
const PRESSURE_STRENGTH = 5.0;
const REST_DISTANCE = PARTICLE_SIZE * 2;
const FORCE_TO_VELOCITY_SCALE = 0.1;

export class Particle {
    public position: Coor;
    public force: Coor = new Coor(0, 0);
    public gravityForce: Coor = new Coor(0, 0);
    public pressureForce: Coor = new Coor(0, 0);

    constructor(x: number, y: number) {
        this.position = new Coor(x, y);
    }

    calculateGravityForce(): void {
        this.gravityForce = this.position.multiply(-PLANET_GRAVITY);
    }

    clearPressureForce(): void {
        this.pressureForce = new Coor(0, 0);
    }

    sumUpForces(): void {
        this.force = this.gravityForce.add(this.pressureForce);
    }

    moveByForce(deltaTime: Second): void {
        this.position.x += this.force.x * deltaTime * FORCE_TO_VELOCITY_SCALE;
        this.position.y += this.force.y * deltaTime * FORCE_TO_VELOCITY_SCALE;
    }

    getTriangleVertices(): number[] {
        const pointingForce: Coor = this.gravityForce;
        const forceLength = pointingForce.distance();

        if (forceLength === 0) {
            // Default upward triangle if no force
            return [
                this.position.x, this.position.y + TRIANGLE_SIZE,
                this.position.x - TRIANGLE_SIZE / TRIANGLE_ASPECT_RATIO, this.position.y - TRIANGLE_SIZE,
                this.position.x + TRIANGLE_SIZE / TRIANGLE_ASPECT_RATIO, this.position.y - TRIANGLE_SIZE
            ];
        }

        // Normalize force direction
        const direction = pointingForce.multiply(1 / forceLength);

        // Calculate triangle vertices pointing in force direction
        const forceAspectRatio = 1.0 + TRIANGLE_ASPECT_RATIO * ( forceLength * FORCE_POINTINESS_SCALE);
        const halfWidth = TRIANGLE_SIZE / forceAspectRatio;
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