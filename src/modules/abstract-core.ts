function uniquePushToArray(arr: any[], value: any) {
    if (arr.indexOf(value) === -1) {
        arr.push(value);
    }
}

export {
    uniquePushToArray,
}
