import {getFormattedCeil} from './abstract-core.js';
import {createEl} from './dom-core.js';
import {ProductAbstract} from './product-abstract.js';

class ProductIcon extends ProductAbstract {
    private qty: number|null = null; // null for startup products
    private htmlElement: HTMLElement;

    constructor(id: string) {
        super(id);

        this.htmlElement = this.makeHtmlElement();
    }

    public getQty(): number|null {
        return this.qty;
    }

    public getHtmlElement(): HTMLElement {
        return this.htmlElement;
    }

    public setAsPrimary(): void {
        this.htmlElement.classList.add('-is-primary');
    }

    public setQty(qty: number): void {
        this.qty = qty;
        // Also add / update the qty in the tooltip
        this.getHtmlElement().dataset.tooltip = `${this.getName()}: ${getFormattedCeil(this.getQty() as number)}`;
    }

    public onClickProductIcon(): void {
        console.log(`--- [onClickProductIcon]`); //// TEST
        //// TO DO: emit event => handle @ "Process" by (IFF output) un-marking the old primary output + marking this output as primary
    }

    public makeHtmlElement(): HTMLElement {
        const el = createEl('div', null, ['product-icon']);
        el.classList.add(`-p${this.id}`);
        el.dataset.tooltip = this.getName();
        el.addEventListener('click', this.onClickProductIcon.bind(this));
        return el;
    }
}

export {
    ProductIcon,
}