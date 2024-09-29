import {createEl} from './dom-core.js';
import {IndustryPlan} from './industry-plan.js';
import {ProductAbstract} from './product-abstract.js';
import {productService} from './product-service.js';

class StartupProduct extends ProductAbstract {
    private parentIndustryPlan: IndustryPlan;
    private htmlElement: HTMLElement;

    constructor(id: string, parentIndustryPlan: IndustryPlan) {
        super(id);

        /**
         * A product is eligible to be a "startup product"
         * only if it can be used as an input for a process.
         */
        if (!productService.getInputProductIds().includes(id)) {
            console.error(`--- ERROR: [StartupProduct] constructor called with invalid id = ${id}`);
            return;
        }
        this.parentIndustryPlan = parentIndustryPlan;
        this.htmlElement = this.makeHtmlElement();
    }

    public getHtmlElement(): HTMLElement {
        return this.htmlElement;
    }

    private makeHtmlElement(): HTMLElement {
        const el = createEl('div', null, ['startup-product']);
        el.innerHTML = /*html*/ `
            <div class="product-icon -p${this.id}" data-tooltip-position="top-left" data-tooltip="${this.getName()}"></div>
            <div class="product-name">${this.getName()}</div>
            <div class="remove-product"></div>
        `;
        el.querySelector('.remove-product')?.addEventListener('click', this.remove.bind(this));
        return el;
    }

    private remove(): void {
        this.htmlElement.parentElement?.removeChild(this.htmlElement);
        this.parentIndustryPlan.onStartupProductRemoved(this);
    }
}

export {
    StartupProduct,
}
