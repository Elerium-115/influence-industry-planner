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

    public getLines(): LineDataStartupProduct[] {
        return this.lines;
    }

    public addLineData(lineData: LineDataStartupProduct): void {
        this.lines.push(lineData);
    }

    private removeLineData(lineData: LineDataStartupProduct): void {
        lineData.line.remove();
        this.lines = removeFromArray(this.lines, lineData);
    }

    public removeLinesByList(linesToRemove: LineDataStartupProduct[]): void {
        linesToRemove.forEach(lineData => this.removeLineData(lineData));
    }

    public removeAllLines(): void {
        this.lines.forEach(lineData => lineData.line.remove());
        this.lines = [];
    }

    /**
     * NOTE: This function should NOT be called from within
     * "addLineData", "removeLineData" etc. in this class,
     * but instead from the overall handlers which call those
     * functions, at the very end of each such handler.
     */
    public markHasLines(): void {
        this.htmlElement.classList.toggle('has-lines', Boolean(this.lines.length));
    }

    public getHtmlElement(): HTMLElement {
        return this.htmlElement;
    }

    private onClickStartupProduct(): void {
        industryPlanService.toggleLinesForStartupProduct(this);
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
