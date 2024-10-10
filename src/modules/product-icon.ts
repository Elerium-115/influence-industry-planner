import {getFormattedRoundNumber} from './abstract-core.js';
import {createEl} from './dom-core.js';
import {Process} from './process.js';
import {ProductAbstract} from './product-abstract.js';

type TooltipPosition = 'top-left'|'top-right'|'bottom-left'|'bottom-right';

class ProductIcon extends ProductAbstract {
    private parentProcess: Process;
    private tooltipPosition: TooltipPosition;
    private qty: number|null = null; // null for startup products

    constructor(id: string, parentProcess: Process, tooltipPosition: TooltipPosition = 'top-left') {
        super(id);

        this.parentProcess = parentProcess;
        this.tooltipPosition = tooltipPosition;
        this.htmlElement = this.makeHtmlElement();
    }

    public toggleIsPrimary(isPrimary: boolean, isPrimaryChanged: boolean = true): void {
        this.htmlElement.classList.toggle('is-primary', isPrimary);
        if (isPrimary && isPrimaryChanged) {
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
        this.htmlElement.dataset.tooltip = `${this.getName()}: ${qtyInTooltip}`;
    }

    private onClickProductIcon(): void {
        this.parentProcess.onInputOrOutputClicked(this);
    }

    private onMouseenterProductIcon(): void {
        this.parentProcess.onInputOrOutputMouseenter(this);
    }

    private onMouseleaveProductIcon(): void {
        this.parentProcess.onInputOrOutputMouseleave(this);
    }

    private makeHtmlElement(): HTMLElement {
        const el = createEl('div', null, ['product-icon', `-p${this.id}`]);
        el.dataset.tooltipPosition = this.tooltipPosition;
        el.dataset.tooltip = this.getName();
        el.addEventListener('click', this.onClickProductIcon.bind(this));
        el.addEventListener('mouseenter', this.onMouseenterProductIcon.bind(this));
        el.addEventListener('mouseleave', this.onMouseleaveProductIcon.bind(this));
        return el;
    }
}

export {
    ProductIcon,
}
