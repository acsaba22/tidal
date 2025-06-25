const FIRST_LOG_INTERVAL_MS = 1000;
const LOG_INTERVAL_MS = 5000;
export class Timer {
    constructor() {
        this.startTime = 0;
        this._average = 0;
        this._count = 0;
    }
    start() {
        this.startTime = performance.now();
    }
    end() {
        const duration = performance.now() - this.startTime;
        this._count++;
        this._average = (this._average * (this._count - 1) + duration) / this._count;
    }
    getMilliseconds() {
        return this._average;
    }
    get count() {
        return this._count;
    }
    reset() {
        this._average = 0;
        this._count = 0;
    }
}
export class Timers {
    constructor() {
        this.timers = new Map();
        this.orderedNames = [];
        this.lastLogTime = 0;
    }
    register(names) {
        this.orderedNames = names;
        for (const name of names) {
            this.timers.set(name, new Timer());
        }
        // Set lastLogTime so first log happens after FIRST_LOG_INTERVAL_MS
        this.lastLogTime = performance.now() - (LOG_INTERVAL_MS - FIRST_LOG_INTERVAL_MS);
    }
    get(name) {
        const timer = this.timers.get(name);
        if (!timer) {
            throw new Error(`Timer '${name}' not registered`);
        }
        return timer;
    }
    logAndReset() {
        if (this.orderedNames.length === 0)
            return;
        const firstTimer = this.timers.get(this.orderedNames[0]);
        const fps = (firstTimer.count * 1000 / LOG_INTERVAL_MS).toFixed(1); // FPS will be off for first interval
        const entries = [`Count: ${firstTimer.count}`, `FPS: ${fps}`];
        for (const name of this.orderedNames) {
            const timer = this.timers.get(name);
            entries.push(`${name}: ${timer.getMilliseconds().toFixed(1)}ms`);
            timer.reset();
        }
        console.log(entries.join(', '));
    }
    logPeriodically() {
        const now = performance.now();
        if (now - this.lastLogTime >= LOG_INTERVAL_MS) {
            this.logAndReset();
            this.lastLogTime = now;
        }
    }
    reset() {
        this.timers.clear();
        this.orderedNames = [];
    }
}
export const globalTimers = new Timers();
// Register timers we'll use
globalTimers.register(['total', 'worldStep']);
// Decorator function
export function timeMethod(timer) {
    return function (target, propertyKey, descriptor) {
        const original = descriptor.value;
        descriptor.value = function (...args) {
            timer.start();
            const result = original.apply(this, args);
            timer.end();
            return result;
        };
        return descriptor;
    };
}
