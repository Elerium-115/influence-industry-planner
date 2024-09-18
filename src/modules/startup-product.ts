import * as InfluenceSDK from '@influenceth/sdk';
import {uniquePushToArray} from './abstract-core.js';
import {createEl} from './dom-core.js';
import {ProductAbstract} from './product-abstract.js';
import {EVENT_PRODUCT, productService} from './product-service.js';

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

    private makeHtmlElement(): HTMLElement {
        const el = createEl('div', null, ['startup-product']);
        el.innerHTML = /*html*/ `
            <div class="product-icon -p${this.id}" data-tooltip="${this.getName()}"></div>
            <div class="product-name">${this.getName()}</div>
            <div class="remove-product"></div>
        `;
        el.querySelector('.remove-product')?.addEventListener('click', this.remove.bind(this));
        return el;
    }

    private remove(): void {
        this.htmlElement.parentElement?.removeChild(this.htmlElement);
        productService.emit(EVENT_PRODUCT.STARTUP_PRODUCT_REMOVED, this);
    }
}

export {
    ELIGIBLE_STARTUP_PRODUCT_IDS,
    StartupProduct,
}
