/**
 * e.g. "Thin-film Resistor" => "thin-film-resistor"
 */
function getItemNameSafe(itemName: string): string {
    return itemName.toLowerCase().replace(/\s+|\//g, '-').replace(/[^\w\-]/g, '');
}

/**
 * e.g. "Thin-film Resistor" => "../assets/products/default/thin-film-resistor.png"
 * Valid formats: "thumb" (low-res) / "default" (medium-res) / "original" (high-res)
 */
function getProductImageSrc(productName: string, format: 'thumb'|'default'|'original' = 'default'): string {
    return `/assets/products/${format}/${getItemNameSafe(productName)}.png`;
}

function getFormattedRoundNumber(num: number, roundUp: boolean = true): string {
    return Intl.NumberFormat().format(roundUp ? Math.ceil(num) : Math.floor(num));
}

function getCompactAddress(address: string): string|null {
    if (!address) {
        return null;
    }
    return address.replace(/^(.{6}).+(.{4})$/, '$1...$2');
}

function uniquePushToArray(arr: any[], value: any): void {
    if (arr.indexOf(value) === -1) {
        arr.push(value);
    }
}

/**
 * NOTE: Do NOT call this function on the elements of an array
 * while that array is being parsed (e.g. via "forEach"), because
 * it mutates that array, leading to skipped elements!
 */
function removeFromArray(arr: any[], value: any): any[] {
    const index = arr.indexOf(value);
    if (index > -1) {
        arr.splice(index, 1);
    }
    return arr;
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export {
    delay,
    getCompactAddress,
    getFormattedRoundNumber,
    getProductImageSrc,
    getItemNameSafe,
    removeFromArray,
    uniquePushToArray,
}
