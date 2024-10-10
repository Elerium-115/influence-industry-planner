import {removeFromArray} from './abstract-core.js';
import {createEl} from './dom-core.js';
import {IndustryPlan} from './industry-plan.js';
import {industryPlanService} from './industry-plan-service.js';
import {ProductAbstract} from './product-abstract.js';
import {productService} from './product-service.js';

interface LineDataStartupProduct {
    line: any, // LeaderLine instance
    elTarget: HTMLElement,
}

class StartupProduct extends ProductAbstract {
    private parentIndustryPlan: IndustryPlan;
    private lines: LineDataStartupProduct[] = [];
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

    public getLines(): any[] {
        return this.lines;
    }

    public removeLines(): void {
        this.lines.forEach(lineData => lineData.line.remove());
        this.lines = [];
    }

    public removeLinesByList(linesToRemove: LineDataStartupProduct[]): void {
        linesToRemove.forEach(lineData => this.removeLineData(lineData));
    }

    private removeLineData(lineData: LineDataStartupProduct): void {
        lineData.line.remove();
        this.lines = removeFromArray(this.lines, lineData);
    }

    public markHasLines(hasLines: boolean): void {
        this.htmlElement.classList.toggle('has-lines', hasLines);
    }

    public getHtmlElement(): HTMLElement {
        return this.htmlElement;
    }

    private onClickStartupProduct(): void {
        industryPlanService.toggleLinesForStartupProduct(this);
        this.markHasLines(Boolean(this.lines.length));
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
        return el;
    }

    private remove(): void {
        this.htmlElement.parentElement?.removeChild(this.htmlElement);
        this.parentIndustryPlan.onStartupProductRemoved(this);
    }
}

export {
    LineDataStartupProduct,
    StartupProduct,
}
