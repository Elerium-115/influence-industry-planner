import * as InfluenceSDK from '@influenceth/sdk';
import {uniquePushToArray} from './abstract-core.js';
import {createEl} from './dom-core.js';
import {ProductAbstract} from './product-abstract.js';

/**
 * A product is eligible to be a "startup product"
 * only if it can be used as an input for a process.
 */
const ELIGIBLE_STARTUP_PRODUCT_IDS: string[] = [];
Object.values(InfluenceSDK.Process.TYPES).forEach((processData: any) => {
    Object.keys(processData.inputs).forEach((idNumeric: any) => {
        uniquePushToArray(ELIGIBLE_STARTUP_PRODUCT_IDS, idNumeric.toString());
    });
});

class StartupProduct extends ProductAbstract {
    private htmlElement: HTMLElement;

    constructor(id: string) {
        super(id);

        if (!ELIGIBLE_STARTUP_PRODUCT_IDS.includes(id)) {
            console.error(`--- ERROR: [StartupProduct] constructor called with invalid id = ${id}`);
            return;
        }
        this.htmlElement = this.makeHtmlElement();
    }

    public getHtmlElement(): HTMLElement {
        return this.htmlElement;
    }

    public makeHtmlElement(): HTMLElement {
        const el = createEl('div', null, ['startup-product']);
        el.innerHTML = /*html*/ `
            <div class="product-icon -p${this.id}" data-tooltip="${this.getName()}"></div>
            <div class="product-name">${this.getName()}</div>
        `;
        return el;
    }
}

export {
    ELIGIBLE_STARTUP_PRODUCT_IDS,
    StartupProduct,
}
