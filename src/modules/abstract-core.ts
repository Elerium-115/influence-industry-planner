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
    return `../assets/products/${format}/${getItemNameSafe(productName)}.png`;
}

function getFormattedRoundNumber(num: number, roundUp: boolean = true): string {
    return Intl.NumberFormat().format(roundUp ? Math.ceil(num) : Math.floor(num));
}

function uniquePushToArray(arr: any[], value: any): void {
    if (arr.indexOf(value) === -1) {
        arr.push(value);
    }
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export {
    delay,
    getFormattedRoundNumber,
    getProductImageSrc,
    getItemNameSafe,
    uniquePushToArray,
}
