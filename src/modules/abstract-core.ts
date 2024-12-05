const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

const MS: {[key: string]: number} = {};
MS.SECOND = 1000;
MS.MINUTE = 60 * MS.SECOND;
MS.HOUR = 60 * MS.MINUTE;
MS.DAY = 24 * MS.HOUR;
MS.WEEK = 7 * MS.DAY;
MS.MONTH = 30 * MS.DAY;
MS.YEAR = 365 * MS.DAY;

/**
 * Human readable elapsed or remaining time (example: 3 min. ago)
 * @param  date A Date object, timestamp or string parsable with Date.parse()
 * @param  nowDate A Date object, timestamp or string parsable with Date.parse()
 * @param  rft A Intl formater
 * @return Human readable elapsed or remaining time
 * @author github.com/victornpb
 * @see https://stackoverflow.com/a/67338038/938822
 */
function fromNow(
    date: Date|number|string,
    nowDate: Date|number|string = Date.now(),
    rft: Intl.RelativeTimeFormat = new Intl.RelativeTimeFormat(undefined, {
        style: 'long',
        numeric: 'always',
    })
): string|undefined {
    const intervals = [
        { ge: MS.YEAR, divisor: MS.YEAR, unit: 'year' },
        { ge: MS.MONTH, divisor: MS.MONTH, unit: 'month' },
        { ge: MS.WEEK, divisor: MS.WEEK, unit: 'week' },
        { ge: MS.DAY, divisor: MS.DAY, unit: 'day' },
        { ge: MS.HOUR, divisor: MS.HOUR, unit: 'hour' },
        { ge: MS.MINUTE, divisor: MS.MINUTE, unit: 'minute' },
        { ge: MS.SECOND, divisor: MS.SECOND, unit: 'seconds' },
        { ge: 0, divisor: 1, text: 'just now' },
    ];
    const now = nowDate instanceof Date ? nowDate.getTime() : new Date(nowDate).getTime();
    const diff = now - (typeof date === 'object' ? date : new Date(date)).getTime();
    const diffAbs = Math.abs(diff);
    for (const interval of intervals) {
        if (diffAbs >= interval.ge) {
            const x = Math.round(diffAbs / interval.divisor);
            const isFuture = diff < 0;
            return interval.unit ? rft.format(isFuture ? x : -x, interval.unit as Intl.RelativeTimeFormatUnit) : interval.text;
        }
    }
}

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

function createEl(
    nodeType: string,
    id: string|null = null,
    classes: string[]|null = null
): HTMLElement {
    const el = document.createElement(nodeType);
    if (id) {
        el.id = id;
    }
    if (classes) {
        classes.forEach(className => el.classList.add(className));
    }
    return el;
}

export {
    MS,
    createEl,
    delay,
    fromNow,
    getCompactAddress,
    getFormattedRoundNumber,
    getProductImageSrc,
    getItemNameSafe,
    isLocalhost,
    removeFromArray,
    uniquePushToArray,
}
