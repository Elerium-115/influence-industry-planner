import {createEl} from './dom-core.js';
import {Processor} from './processor.js';
import {I_PROCESS_DATA, processService} from './process-service.js';
import {ProductIcon} from './product-icon.js';
import {productService} from './product-service.js';

class Process {
    private id: number|null = null;
    private data: I_PROCESS_DATA;
    private parentProcessor: Processor;
    private inputs: ProductIcon[] = [];
    private outputs: ProductIcon[] = [];
    private primaryOutput: ProductIcon;
    private htmlElement: HTMLElement;

    constructor(id: number, parentProcessor: Processor) {
        this.id = id;
        this.data = processService.getProcessDataById(id);
        if (!this.data) {
            console.error(`--- ERROR: [Process] constructor called with invalid id = ${id}`);
            return;
        }
        this.parentProcessor = parentProcessor;
        this.htmlElement = this.makeHtmlElement();
        // Add inputs
        this.getInputProductIds().forEach(productId => {
            this.addInputOrOutput(productId, 'input');
        });
        // Add outputs
        this.getOutputProductIds().forEach((productId) => {
            this.addInputOrOutput(productId, 'output');
        });
        this.sortAndRenderInputsAndOutputs();
        // The first output is primary by default
        const firstOutput = this.outputs[0];
        if (firstOutput) {
            this.setPrimaryOutput(firstOutput);
        }
        // Add spectral types as inputs for extractions
        if (this.isExtraction()) {
            this.addSpectralTypesAsInputs();
        }
    }

    public getId(): number|null {
        return this.id;
    }

    public getOutputs(): ProductIcon[] {
        return this.outputs;
    }

    public getData(): I_PROCESS_DATA {
        return this.data;
    }

    private getName(): string {
        return this.data.name;
    }

    public getHtmlElement(): HTMLElement {
        return this.htmlElement;
    }

    private getInputProductIds(): string[] {
        return Object.keys(this.data.inputs);
    }

    private getOutputProductIds(): string[] {
        return Object.keys(this.data.outputs);
    }

    private getElInputs(): HTMLElement {
        // Always "HTMLElement", never "null"
        return this.htmlElement.querySelector('.inputs') as HTMLElement;
    }

    private getElOutputs(): HTMLElement {
        // Always "HTMLElement", never "null"
        return this.htmlElement.querySelector('.outputs') as HTMLElement;
    }

    private isExtraction(): boolean {
        return !this.inputs.length && this.outputs.length === 1 && this.outputs[0].isRawMaterial();
    }

    private addInputOrOutput(productId: string, inputOrOutput: 'input'|'output'): void {
        const productIcon = new ProductIcon(productId, this);
        if (!productIcon.getData()) {
            // Invalid product / ID
            return;
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

    private sortAndRenderInputsAndOutputs(): void {
        // Sort inputs and outputs alphabetically
        productService.sortProductsByName(this.inputs);
        productService.sortProductsByName(this.outputs);
        // Add input-product icons into the DOM
        this.inputs.forEach((inputProductIcon: ProductIcon) => {
            this.getElInputs().append(inputProductIcon.getHtmlElement());
        });
        // Add output-product icons into the DOM
        this.outputs.forEach((outputProductIcon: ProductIcon) => {
            this.getElOutputs().append(outputProductIcon.getHtmlElement());
        });
    }

    private setPrimaryOutput(output: ProductIcon): void {
        if (this.primaryOutput === output) {
            // Primary output did not change
            return;
        }
        // Unset old primary output
        this.primaryOutput?.toggleIsPrimary(false);
        // Set new primary output
        this.primaryOutput = output;
        output.toggleIsPrimary(true);
        /**
         * Update qty for all outputs, based on:
         * - current primary output
         * - global penalty for secondary outputs
         */
        this.outputs.forEach(output => {
            const penalty = output === this.primaryOutput ? 0 : processService.getPenaltyForSecondaryOutputs();
            const outputProductId = output.getId();
            if (!outputProductId) {
                return;
            }
            const qtyRaw: number = this.data.outputs[outputProductId];
            const qtyWithPenalty = qtyRaw * (1 - penalty);
            // Round down the output qty
            output.setQty(qtyWithPenalty, false);
        });
    }

    private addSpectralTypesAsInputs(): void {
        const pureSpectralTypes = productService.getSpectralTypesForRawMaterialId(this.outputs[0].getId(), true);
        pureSpectralTypes.forEach(pureSpectralType => {
            const spectralTypes = productService.getSpectralTypesForPureSpectralType(pureSpectralType);
            const elSpectralType = createEl('div', null, ['spectral-type']);
            elSpectralType.textContent = pureSpectralType;
            elSpectralType.dataset.tooltip = spectralTypes.join(', ');
            this.getElInputs().append(elSpectralType);
        });
    }

    public onInputOrOutputClicked(inputOrOutput: ProductIcon): void {
        if (this.outputs.includes(inputOrOutput)) {
            // Output product clicked => set as primary output
            this.setPrimaryOutput(inputOrOutput);
        }
    }

    public onInputOrOutputMouseenter(inputOrOutput: ProductIcon): void {
        //// TO DO: show connections to inputs / outputs from other processes
    }

    public onInputOrOutputMouseleave(inputOrOutput: ProductIcon): void {
        //// TO DO: hide connections to inputs / outputs from other processes
    }

    private makeHtmlElement(): HTMLElement {
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

    private remove(): void {
        this.htmlElement.parentElement?.removeChild(this.htmlElement);
        this.parentProcessor.onProcessRemoved(this);
    }
}

export {
    Process,
}
