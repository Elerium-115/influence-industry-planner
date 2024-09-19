import {getFormattedRoundNumber} from './abstract-core.js';
import {createEl} from './dom-core.js';
import {Process} from './process.js';
import {ProductAbstract} from './product-abstract.js';

class ProductIcon extends ProductAbstract {
    private parentProcess: Process;
    private qty: number|null = null; // null for startup products
    private htmlElement: HTMLElement;

    constructor(id: string, parentProcess: Process) {
        super(id);

        this.parentProcess = parentProcess;
        this.htmlElement = this.makeHtmlElement();
    }

    public getHtmlElement(): HTMLElement {
        return this.htmlElement;
    }

    public toggleIsPrimary(isPrimary: boolean): void {
        this.htmlElement.classList.toggle('is-primary', isPrimary);
        if (isPrimary) {
            this.htmlElement.classList.add('flash-primary');
            setTimeout(() => {
                this.htmlElement.classList.remove('flash-primary');
            }, 500); // match the animation duration for "flash-primary"
        }
    }

    public setQty(qty: number, roundUpInTooltip: boolean = true): void {
        this.qty = qty;
        // Also add / update the qty in the tooltip
        const qtyInTooltip = getFormattedRoundNumber(qty, roundUpInTooltip);
        this.getHtmlElement().dataset.tooltip = `${this.getName()}: ${qtyInTooltip}`;
    }

    private onClickProductIcon(): void {
        this.parentProcess.onInputOrOutputClicked(this);
    }

    private makeHtmlElement(): HTMLElement {
        const el = createEl('div', null, ['product-icon', `-p${this.id}`]);
        el.dataset.tooltip = this.getName();
        el.addEventListener('click', this.onClickProductIcon.bind(this));
        return el;
    }
}

export {
    ProductIcon,
}
