import { Second } from './types.js';

export interface Vector2 {
    x: number;
    y: number;
}

const PARTICLE_SIZE = 0.01;
const GRID_DISTANCE = PARTICLE_SIZE * 2;
const GRID_SIZE = 10;
const PLANET_GRAVITY = 1.0;

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

    step(deltaTime: Second): void {
        this.calculateForces();

        for (const particle of this.particles) {
            particle.moveByForce(deltaTime);
        }
    }
}