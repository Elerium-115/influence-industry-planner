import * as InfluenceSDK from '@influenceth/sdk';
import {uniquePushToArray} from './abstract-core.js';
import {createEl} from './dom-core.js';

const ELIGIBLE_STARTUP_PRODUCT_IDS: string[] = [];
Object.values(InfluenceSDK.Process.TYPES).forEach((processData: any) => {
    Object.keys(processData.inputs).forEach((idNumeric: any) => {
        uniquePushToArray(ELIGIBLE_STARTUP_PRODUCT_IDS, idNumeric.toString());
    });
});

class StartupProduct {
    private id: string|null = null;
    private name: string;
    private htmlElement: HTMLElement;

    constructor(id: string) {
        if (!ELIGIBLE_STARTUP_PRODUCT_IDS.includes(id)) {
            console.error(`--- ERROR: [StartupProduct] constructor called with invalid id = ${id}`); //// TEST
            return;
        }
        this.id = id;
        this.name = InfluenceSDK.Product.TYPES[id]?.name || null;
        this.htmlElement = this.makeHtmlElement();
    }

    public getId(): string|null {
        return this.id;
    }

    public getName(): string {
        return this.name;
    }

    public getHtmlElement(): HTMLElement {
        return this.htmlElement;
    }

    public makeHtmlElement(): HTMLElement {
        const el = createEl('div', null, ['startup-product']);
        el.innerHTML = /*html*/ `
            <div class="product-icon -p${this.id}" data-tooltip="${this.name}"></div>
            <div class="product-name">${this.name}</div>
        `;
        return el;
    }
}

export {
    ELIGIBLE_STARTUP_PRODUCT_IDS,
    StartupProduct,
}
