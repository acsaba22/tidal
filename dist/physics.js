const PARTICLE_SIZE = 0.01;
const GRID_DISTANCE = PARTICLE_SIZE * 2;
const GRID_SIZE = 10;
export class Particle {
    constructor(x, y) {
        this.position = { x, y };
    }
}
export class PhysicalWorld {
    constructor() {
        this.particles = [];
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
    step(deltaTime) {
        for (const particle of this.particles) {
            particle.position.x += 0.01 * deltaTime;
        }
    }
}
