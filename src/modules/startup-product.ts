import {createEl} from './dom-core.js';
import {IndustryPlan} from './industry-plan.js';
import {leaderLineService} from './leader-line-service.js';
import {ProductAbstract} from './product-abstract.js';
import {productService} from './product-service.js';

class StartupProduct extends ProductAbstract {
    private parentIndustryPlan: IndustryPlan;

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

    private onClickStartupProduct(): void {
        leaderLineService.toggleLinesForStartupProduct(this);
        leaderLineService.increaseLinesForStartupProduct(this);
    }

    private onMouseenterStartupProduct(): void {
        leaderLineService.increaseLinesForStartupProduct(this);
    }

    private onMouseleaveStartupProduct(): void {
        leaderLineService.decreaseLinesForStartupProduct(this);
    }

    private makeHtmlElement(): HTMLElement {
        const el = createEl('div', null, ['startup-product']);
        el.innerHTML = /*html*/ `
            <div class="product-icon -p${this.id}" data-tooltip-position="top-left" data-tooltip="${this.getName()}"></div>
            <div class="product-name">${this.getName()}</div>
            <div class="remove-product"></div>
        `;
        el.querySelector('.remove-product')?.addEventListener('click', this.remove.bind(this));
        el.addEventListener('click', this.onClickStartupProduct.bind(this));
        el.addEventListener('mouseenter', this.onMouseenterStartupProduct.bind(this));
        el.addEventListener('mouseleave', this.onMouseleaveStartupProduct.bind(this));
        return el;
    }

    private remove(event: MouseEvent): void {
        // Prevent this event from triggering "onClickStartupProduct"
        event.stopPropagation();
        this.removeAllLines();
        this.htmlElement.parentElement?.removeChild(this.htmlElement);
        this.parentIndustryPlan.onStartupProductRemoved(this);
    }
}

export {
    StartupProduct,
}
