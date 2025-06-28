export type Millisecond = number;
export type Second = number;

export function msToSeconds(ms: Millisecond): Second {
    return ms * 0.001;
}

export function smartToString(num: number, decimals: number = 2): string {
    if (num >= 0.001 && num < 1000) {
        return num.toPrecision(3);
    } else {
        return num.toExponential(2);
    }
}