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
function getProductImageSrc(productName: string, format: 'thumb'|'default'|'original' = 'default') {
    return `../assets/products/${format}/${getItemNameSafe(productName)}.png`;
}

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
    getProductImageSrc,
    getItemNameSafe,
    uniquePushToArray,
}
