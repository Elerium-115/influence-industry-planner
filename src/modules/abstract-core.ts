function getFormattedCeil(num: number): string {
    return Intl.NumberFormat().format(Math.ceil(num));
}

function uniquePushToArray(arr: any[], value: any): void {
    if (arr.indexOf(value) === -1) {
        arr.push(value);
    }
}

export {
    getFormattedCeil,
    uniquePushToArray,
}
