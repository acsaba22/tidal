export type Millisecond = number;
export type Second = number;

export function msToSeconds(ms: Millisecond): Second {
    return ms * 0.001;
}