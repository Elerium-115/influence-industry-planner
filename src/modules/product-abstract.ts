import {removeFromArray} from './abstract-core.js';
import {LineDataWithTarget} from './leader-line-service.js';
import {I_PRODUCT_DATA, productService} from './product-service.js';

class ProductAbstract {
    /**
     * Product ID formats:
     * - '1', '2', '3' etc. for standard products
     * - 'B1', 'B2' etc. for buildings
     * - 'S1', 'S2' etc. for ships
     */
    protected id: string;
    protected data: I_PRODUCT_DATA;
    protected lines: LineDataWithTarget[] = [];
    protected htmlElement: HTMLElement;

    constructor(id: string) {
        this.id = id;
        this.data = productService.getProductDataById(id);
        if (!this.data) {
            console.error(`--- ERROR: [ProductAbstract] constructor called with invalid id = ${id}`);
            return;
        }
    }

    public getId(): string {
        return this.id;
    }

    public getData(): I_PRODUCT_DATA {
        return this.data;
    }

    public getName(): string {
        return this.data.name;
    }

    public getLines(): LineDataWithTarget[] {
        return this.lines;
    }

    public addLineData(lineData: LineDataWithTarget): void {
        this.lines.push(lineData);
    }

    private removeLineData(lineData: LineDataWithTarget): void {
        lineData.line.remove();
        this.lines = removeFromArray(this.lines, lineData);
    }

    public removeLinesByList(linesToRemove: LineDataWithTarget[]): void {
        linesToRemove.forEach(lineData => this.removeLineData(lineData));
    }

    public removeAllLines(): void {
        this.lines.forEach(lineData => lineData.line.remove());
        this.lines = [];
        this.markHasLines();
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
}

export {
    ProductAbstract,
}
