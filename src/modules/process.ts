import * as InfluenceSDK from '@influenceth/sdk';
import {getFormattedCeil} from './abstract-core.js';
import {createEl} from './dom-core.js';
import {ProductIcon} from './product-icon.js';
import {ProductService} from './product-service.js';

interface I_PROCESS_DATA {
    i: number,
    name: string,
    processorType: number,
    setupTime: number,
    recipeTime: number,
    inputs: Object, //// TO DO: further detail this as key: string, value: number?
    outputs: Object, //// TO DO: further detail this as key: string, value: number?
    batched?: boolean, // NOT defined for ship integrations and building constructions
};

class Process {
    private productService: ProductService = ProductService.getInstance(); // singleton

    private id: number|null = null;
    private data: I_PROCESS_DATA;
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
            this.injectElProductIcon(productId, 'input');
        });
        // Add outputs
        this.getOutputProductIds().forEach((productId, idx) => {
            this.injectElProductIcon(productId, 'output', idx);
        });
        if (!this.getOutputProductIds().length) {
            // Output is ship or building
            switch(this.data.processorType) {
                case InfluenceSDK.Processor.IDS.DRY_DOCK: {
                    // Ship
                    const productData = this.productService.getProductDataForShipIntegration(this.data.name);
                    if (productData) {
                        // qty = 1
                        this.data.outputs = {[productData.i]: 1};
                        this.injectElProductIcon(productData.i as string, 'output');
                    }
                    break;
                }
                case InfluenceSDK.Processor.IDS.CONSTRUCTION: {
                    // Building
                    const productData = this.productService.getProductDataForBuildingConstruction(this.data.name);
                    if (productData) {
                        // qty = 1
                        this.data.outputs = {[productData.i]: 1};
                        this.injectElProductIcon(productData.i as string, 'output');
                    }
                    break;
                }
            }
        }
        //// TO DO: add output for ship integrations and building constructions
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

    public injectElProductIcon(productId: string, inputOrOutput: 'input'|'output', idx = 0): void {
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
                // Inject qty in tooltip
                const inputQty = getFormattedCeil(this.data.inputs[productId]);
                productIcon.getHtmlElement().dataset.tooltip += `: ${inputQty}`;
                // Inject input-product icon
                this.getElInputs().append(productIcon.getHtmlElement());
                break;
            case 'output':
                // Inject qty in tooltip
                const outputQty = getFormattedCeil(this.data.outputs[productId]);
                productIcon.getHtmlElement().dataset.tooltip += `: ${outputQty}`;
                // Inject output-product icon
                this.getElOutputs().append(productIcon.getHtmlElement());
                break;
        }
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
