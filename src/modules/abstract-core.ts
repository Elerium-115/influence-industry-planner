const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

const MS_SECOND = 1000;
const MS_MINUTE = 60 * MS_SECOND;
const MS_HOUR = 60 * MS_MINUTE;
const MS_DAY = 24 * MS_HOUR;
const MS_WEEK = 7 * MS_DAY;
const MS_MONTH = 30 * MS_DAY;
const MS_YEAR = 365 * MS_DAY;

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
        { ge: MS_YEAR, divisor: MS_YEAR, unit: 'year' },
        { ge: MS_MONTH, divisor: MS_MONTH, unit: 'month' },
        { ge: MS_WEEK, divisor: MS_WEEK, unit: 'week' },
        { ge: MS_DAY, divisor: MS_DAY, unit: 'day' },
        { ge: MS_HOUR, divisor: MS_HOUR, unit: 'hour' },
        { ge: MS_MINUTE, divisor: MS_MINUTE, unit: 'minute' },
        { ge: MS_SECOND, divisor: MS_SECOND, unit: 'seconds' },
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
