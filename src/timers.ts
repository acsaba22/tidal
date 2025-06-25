const FIRST_LOG_INTERVAL_MS = 1000;
const LOG_INTERVAL_MS = 5000;

export class Timer {
    private startTime: number = 0;
    private _average: number = 0;
    private _count: number = 0;
    
    start(): void {
        this.startTime = performance.now();
    }
    
    end(): void {
        const duration = performance.now() - this.startTime;
        this._count++;
        this._average = (this._average * (this._count - 1) + duration) / this._count;
    }
    
    getMilliseconds(): number {
        return this._average;
    }
    
    get count(): number {
        return this._count;
    }
    
    reset(): void {
        this._average = 0;
        this._count = 0;
    }
}

export class Timers {
    private timers = new Map<string, Timer>();
    private orderedNames: string[] = [];
    private lastLogTime = 0;
    
    register(names: string[]): void {
        this.orderedNames = names;
        for (const name of names) {
            this.timers.set(name, new Timer());
        }
        // Set lastLogTime so first log happens after FIRST_LOG_INTERVAL_MS
        this.lastLogTime = performance.now() - (LOG_INTERVAL_MS - FIRST_LOG_INTERVAL_MS);
    }
    
    get(name: string): Timer {
        const timer = this.timers.get(name);
        if (!timer) {
            throw new Error(`Timer '${name}' not registered`);
        }
        return timer;
    }
    
    logAndReset(): void {
        if (this.orderedNames.length === 0) return;
        
        const firstTimer = this.timers.get(this.orderedNames[0])!;
        const fps = (firstTimer.count * 1000 / LOG_INTERVAL_MS).toFixed(1); // FPS will be off for first interval
        const entries: string[] = [`Count: ${firstTimer.count}`, `FPS: ${fps}`];
        
        for (const name of this.orderedNames) {
            const timer = this.timers.get(name)!;
            entries.push(`${name}: ${timer.getMilliseconds().toFixed(1)}ms`);
            timer.reset();
        }
        
        console.log(entries.join(', '));
    }
    
    logPeriodically(): void {
        const now = performance.now();
        if (now - this.lastLogTime >= LOG_INTERVAL_MS) {
            this.logAndReset();
            this.lastLogTime = now;
        }
    }
    
    reset(): void {
        this.timers.clear();
        this.orderedNames = [];
    }
}

export const globalTimers = new Timers();

// Register timers we'll use
globalTimers.register(['total', 'worldStep']);

// Decorator function
export function timeMethod(timer: Timer) {
    return function<T extends (...args: any[]) => any>(
        target: any, 
        propertyKey: string, 
        descriptor: TypedPropertyDescriptor<T>
    ): TypedPropertyDescriptor<T> {
        const original = descriptor.value!;
        descriptor.value = (function(...args: any[]) {
            timer.start();
            const result = original.apply(this, args);
            timer.end();
            return result;
        } as any) as T;
        return descriptor;
    };
}