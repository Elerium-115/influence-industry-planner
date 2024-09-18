import * as InfluenceSDK from '@influenceth/sdk';
import {createEl} from './dom-core.js';
import {ProductIcon} from './product-icon.js';
import {productService} from './product-service.js';
import {I_PROCESS_DATA} from './process-service.js';

class Process {
    private id: number|null = null;
    private data: I_PROCESS_DATA;
    private inputs: ProductIcon[] = [];
    private outputs: ProductIcon[] = [];
    private htmlElement: HTMLElement;

    constructor(id: number) {
        this.id = id;
        this.data = InfluenceSDK.Process.TYPES[id];
        if (!this.data) {
            console.error(`--- ERROR: [Process] constructor called with invalid id = ${id}`);
            return;
        }
        this.htmlElement = this.makeHtmlElement();
        // Add inputs
        this.getInputProductIds().forEach(productId => {
            this.addInputOrOutput(productId, 'input');
        });
        // Add outputs
        this.getOutputProductIds().forEach((productId, idx) => {
            this.addInputOrOutput(productId, 'output', idx);
        });
        this.handleEmptyOutputsIfAny();
        this.sortAndRenderInputsAndOutputs();
    }

    public getId(): number|null {
        return this.id;
    }

    public getData(): I_PROCESS_DATA {
        return this.data;
    }

    public getName(): string {
        return this.data.name;
    }

    public getHtmlElement(): HTMLElement {
        return this.htmlElement;
    }

    public getInputProductIds(): string[] {
        return Object.keys(this.data.inputs);
    }

    public getOutputProductIds(): string[] {
        return Object.keys(this.data.outputs);
    }

    public getElInputs(): HTMLElement {
        // Always "HTMLElement", never "null"
        return this.htmlElement.querySelector('.inputs') as HTMLElement;
    }

    public getElOutputs(): HTMLElement {
        // Always "HTMLElement", never "null"
        return this.htmlElement.querySelector('.outputs') as HTMLElement;
    }

    private addInputOrOutput(productId: string, inputOrOutput: 'input'|'output', idx = 0): void {
        const productIcon = new ProductIcon(productId);
        if (!productIcon.getData()) {
            // Invalid product / ID
            return;
        }
        if (inputOrOutput === 'output' && idx === 0) {
            // The first output is primary by default
            productIcon.setAsPrimary();
        }
        switch (inputOrOutput) {
            case 'input':
                productIcon.setQty(this.data.inputs[productId]);
                this.inputs.push(productIcon);
                break;
            case 'output':
                productIcon.setQty(this.data.outputs[productId]);
                this.outputs.push(productIcon);
                break;
        }
    }

    /**
     * Handle empty outputs in the SDK data (for ships and buildings)
     */
    private handleEmptyOutputsIfAny(): void {
        if (this.outputs.length) {
            return;
        }
        switch (this.data.processorType) {
            case InfluenceSDK.Processor.IDS.DRY_DOCK: {
                // Hardcode output = ship
                const productData = productService.getProductDataForShipIntegration(this.data.name);
                if (productData) {
                    // Hardcode qty = 1
                    this.data.outputs = {[productData.i]: 1};
                    this.addInputOrOutput(productData.i as string, 'output');
                }
                break;
            }
            case InfluenceSDK.Processor.IDS.CONSTRUCTION: {
                // Hardcode output = building
                const productData = productService.getProductDataForBuildingConstruction(this.data.name);
                if (productData) {
                    // Hardcode qty = 1
                    this.data.outputs = {[productData.i]: 1};
                    this.addInputOrOutput(productData.i as string, 'output');
                }
                break;
            }
        }
    }

    private sortAndRenderInputsAndOutputs(): void {
        // Sort inputs and outputs alphabetically
        this.inputs.sort(this.compareProductsByName);
        this.outputs.sort(this.compareProductsByName);
        // Add input-product icons into the DOM
        this.inputs.forEach((inputProductIcon: ProductIcon) => {
            this.getElInputs().append(inputProductIcon.getHtmlElement());
        });
        // Add output-product icons into the DOM
        this.outputs.forEach((outputProductIcon: ProductIcon) => {
            this.getElOutputs().append(outputProductIcon.getHtmlElement());
        });
    }

    private compareProductsByName(p1: ProductIcon, p2: ProductIcon): number {
        return p1.getName().localeCompare(p2.getName());
    }

    public remove(): void {
        this.htmlElement.parentElement?.removeChild(this.htmlElement);
        //// TO DO: also remove this class instance from the parent "Processor"
    }

    public makeHtmlElement(): HTMLElement {
        const el = createEl('div', null, ['process']);
        el.innerHTML = /*html*/ `
            <div class="process-header" data-tooltip="${this.getName()}">
                <div class="process-name">${this.getName()}</div>
            </div>
            <div class="process-materials">
                <div class="inputs"></div>
                <div class="separator"></div>
                <div class="outputs"></div>
            </div>
            <div class="remove-process"></div>
        `;
        el.querySelector('.remove-process')?.addEventListener('click', this.remove.bind(this));
        return el;
    }
}

export {
    Process,
}
