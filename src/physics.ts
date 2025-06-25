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

export class Particle {
    public position: Vector2;
    public force: Vector2 = { x: 0, y: 0 };

    constructor(x: number, y: number) {
        this.position = { x, y };
    }

    calculateGravityForce(): void {
        this.force.x = -this.position.x * PLANET_GRAVITY;
        this.force.y = -this.position.y * PLANET_GRAVITY;
    }

    moveByForce(deltaTime: Second): void {
        this.position.x += this.force.x * deltaTime * 0.01;
        this.position.y += this.force.y * deltaTime * 0.01;
    }

    getTriangleVertices(): number[] {
        const forceLength = Math.sqrt(this.force.x * this.force.x + this.force.y * this.force.y);

        if (forceLength === 0) {
            // Default upward triangle if no force
            return [
                this.position.x, this.position.y + TRIANGLE_SIZE,
                this.position.x - TRIANGLE_SIZE / TRIANGLE_ASPECT_RATIO, this.position.y - TRIANGLE_SIZE,
                this.position.x + TRIANGLE_SIZE / TRIANGLE_ASPECT_RATIO, this.position.y - TRIANGLE_SIZE
            ];
        }

        // Normalize force direction
        const dirX = this.force.x / forceLength;
        const dirY = this.force.y / forceLength;

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

    calculateForces(): void {
        for (const particle of this.particles) {
            particle.calculateGravityForce();
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