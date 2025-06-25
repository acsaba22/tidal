import { Second } from './types.js';

export interface Vector2 {
    x: number;
    y: number;
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
    public position: Vector2;
    public force: Vector2 = { x: 0, y: 0 };
    public gravityForce: Vector2 = { x: 0, y: 0 };
    public pressureForce: Vector2 = { x: 0, y: 0 };

    constructor(x: number, y: number) {
        this.position = { x, y };
    }

    calculateGravityForce(): void {
        this.gravityForce.x = -this.position.x * PLANET_GRAVITY;
        this.gravityForce.y = -this.position.y * PLANET_GRAVITY;
    }

    clearPressureForce(): void {
        this.pressureForce.x = 0;
        this.pressureForce.y = 0;
    }

    sumUpForces(): void {
        this.force.x = this.gravityForce.x + this.pressureForce.x;
        this.force.y = this.gravityForce.y + this.pressureForce.y;
    }

    moveByForce(deltaTime: Second): void {
        this.position.x += this.force.x * deltaTime * FORCE_TO_VELOCITY_SCALE;
        this.position.y += this.force.y * deltaTime * FORCE_TO_VELOCITY_SCALE;
    }

    getTriangleVertices(): number[] {
        const pointingForce: Vector2 = this.gravityForce;
        const forceLength = Math.sqrt(pointingForce.x * pointingForce.x + pointingForce.y * pointingForce.y);

        if (forceLength === 0) {
            // Default upward triangle if no force
            return [
                this.position.x, this.position.y + TRIANGLE_SIZE,
                this.position.x - TRIANGLE_SIZE / TRIANGLE_ASPECT_RATIO, this.position.y - TRIANGLE_SIZE,
                this.position.x + TRIANGLE_SIZE / TRIANGLE_ASPECT_RATIO, this.position.y - TRIANGLE_SIZE
            ];
        }

        // Normalize force direction
        const dirX = pointingForce.x / forceLength;
        const dirY = pointingForce.y / forceLength;

        // Calculate triangle vertices pointing in force direction
        const forceAspectRatio = 1.0 + TRIANGLE_ASPECT_RATIO * ( forceLength * FORCE_POINTINESS_SCALE);
        const halfWidth = TRIANGLE_SIZE / forceAspectRatio;
        const height = TRIANGLE_SIZE;

        // Tip point (in force direction)
        const tipX = this.position.x + dirX * height;
        const tipY = this.position.y + dirY * height;

        // Base points (perpendicular to force direction)
        const perpX = -dirY;
        const perpY = dirX;

        const base1X = this.position.x - dirX * height + perpX * halfWidth;
        const base1Y = this.position.y - dirY * height + perpY * halfWidth;
        const base2X = this.position.x - dirX * height - perpX * halfWidth;
        const base2Y = this.position.y - dirY * height - perpY * halfWidth;

        return [tipX, tipY, base1X, base1Y, base2X, base2Y];
    }
}

function addPressureForceBetween(p1: Particle, p2: Particle): void {
    const dx = p2.position.x - p1.position.x;
    const dy = p2.position.y - p1.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < REST_DISTANCE && distance > 0) {
        const overlap = REST_DISTANCE - distance;
        const forceMagnitude = PRESSURE_STRENGTH * overlap;
        
        const fx = forceMagnitude * (dx / distance);
        const fy = forceMagnitude * (dy / distance);

        p1.pressureForce.x -= fx;
        p1.pressureForce.y -= fy;
        p2.pressureForce.x += fx;
        p2.pressureForce.y += fy;
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
        this.calculateForces();

        for (const particle of this.particles) {
            particle.moveByForce(deltaTime);
        }
    }
}