const PARTICLE_SIZE = 0.01;
const GRID_DISTANCE = PARTICLE_SIZE * 2;
const GRID_SIZE = 10;
const PLANET_GRAVITY = 1.0;
export class Particle {
    constructor(x, y) {
        this.force = { x: 0, y: 0 };
        this.position = { x, y };
    }
    calculateGravityForce() {
        this.force.x = -this.position.x * PLANET_GRAVITY;
        this.force.y = -this.position.y * PLANET_GRAVITY;
    }
    moveByForce(deltaTime) {
        this.position.x += this.force.x * deltaTime * 0.01;
        this.position.y += this.force.y * deltaTime * 0.01;
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
    calculateForces() {
        for (const particle of this.particles) {
            particle.calculateGravityForce();
        }
    }
    step(deltaTime) {
        this.calculateForces();
        for (const particle of this.particles) {
            particle.moveByForce(deltaTime);
        }
    }
}
