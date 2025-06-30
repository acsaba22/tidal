export function msToSeconds(ms) {
    return ms * 0.001;
}
export function smartToString(num, decimals = 2) {
    if (num >= 0.0001 && num < 10000) {
        return num.toPrecision(3);
    }
    else {
        return num.toExponential(2);
    }
}
