export function msToSeconds(ms) {
    return ms * 0.001;
}
export function smartToString(num, decimals = 2) {
    if (num >= 0.001 && num < 1000) {
        return num.toPrecision(3);
    }
    else {
        return num.toExponential(2);
    }
}
