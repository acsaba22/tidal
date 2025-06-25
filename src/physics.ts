import { Second } from './types.js';

export interface Vector2 {
    x: number;
    y: number;
}

const PARTICLE_SIZE = 0.01;
const GRID_DISTANCE = PARTICLE_SIZE * 2;
const GRID_SIZE = 10;

export class Particle {
    public position: Vector2;

    constructor(x: number, y: number) {
        this.position = { x, y };
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

    step(deltaTime: Second): void {
        for (const particle of this.particles) {
            particle.position.x += 0.01 * deltaTime;
        }
    }
}