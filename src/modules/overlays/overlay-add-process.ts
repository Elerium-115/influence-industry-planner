import {getFormattedRoundNumber} from '../abstract-core.js';
import {createEl} from '../dom-core.js';
import {OverlayAbstract} from './overlay-abstract';
import {industryPlanService} from '../industry-plan-service.js';
import {IndustryTier} from '../industry-tier.js';
import {Processor} from '../processor.js';
import {I_PROCESS_DATA} from '../process-service.js';
import {ProductAbstract} from '../product-abstract.js';
import {productService} from '../product-service.js';

interface I_INPUT_OR_OUTPUT_DATA {
    name: string,
    productId: string,
    qty: number,
}

class OverlayAddProcess extends OverlayAbstract {
    private parentIndustryTier: IndustryTier;
    private parentProcessor: Processor;
    private availableInputs: ProductAbstract[] = [];
    private eligibleProcesses: I_PROCESS_DATA[] = [];

    constructor(parentProcessor: Processor, parentIndustryTier: IndustryTier) {
        super();

        this.parentIndustryTier = parentIndustryTier;
        this.parentProcessor = parentProcessor;
        this.availableInputs = industryPlanService.getAvailableInputsForIndustryTier(this.parentIndustryTier);
        this.eligibleProcesses = industryPlanService.getEligibleProcessesForProcessorUsingInputs(this.parentProcessor, this.availableInputs);
        this.populateElOverlayContent();
    }

    private getElAvailableInputsList(): HTMLElement {
        // Always "HTMLElement", never "null"
        return this.elOverlayContent.querySelector('.available-inputs-list') as HTMLElement;
    }

    private getElEligibleProcessesList(): HTMLElement {
        // Always "HTMLElement", never "null"
        return this.elOverlayContent.querySelector('.eligible-processes-list') as HTMLElement;
    }

    private onClickProcess(processId: number): void {
        this.parentProcessor.addProcessById(processId);
        this.remove();
    }

    private populateElAvailableInputsList(): void {
        let listHtml = '';
        this.availableInputs.forEach(product => {
            listHtml += /*html*/ `
                <label>
                    <input type="checkbox" checked>
                    <div class="product-icon -p${product.getId()}" data-tooltip="${product.getName()}"></div>
                    <div class="product-name">${product.getName()}</div>
                </label>
            `;
        });
        this.getElAvailableInputsList().innerHTML = listHtml;
        //// TO DO: add logic for toggling inputs-checkboxes + filters-checkboxes + search => filter eligible processes
    }

    private populateElEligibleProcessesList(): void {
        this.eligibleProcesses.forEach(processData => {
            this.getElEligibleProcessesList().append(this.makeElEligibleProcess(processData));
        });
    }

    private makeElEligibleProcess(processData: I_PROCESS_DATA): HTMLElement {
        // Sort inputs and outputs alphabetically before parsing them
        const inputsDataList: I_INPUT_OR_OUTPUT_DATA[] = Object.keys(processData.inputs).map(productId => ({
            name: productService.getProductDataById(productId).name,
            productId,
            qty: processData.inputs[productId],
        }));
        const outputsDataList: I_INPUT_OR_OUTPUT_DATA[] = Object.keys(processData.outputs).map(productId => ({
            name: productService.getProductDataById(productId).name,
            productId,
            qty: processData.outputs[productId],
        }));
        inputsDataList.sort(this.compareProductsByName);
        outputsDataList.sort(this.compareProductsByName);
        // Generate HTML for inputs and outputs
        let inputsHtml = '';
        let outputsHtml = '';
        inputsDataList.forEach(inputData => {
            inputsHtml += this.makeInputOrOutputHtml(inputData.productId, inputData.qty);
        });
        outputsDataList.forEach(outputData => {
            outputsHtml += this.makeInputOrOutputHtml(outputData.productId, outputData.qty);
        });
        const el = createEl('div', null, ['process']);
        el.innerHTML = /*html*/ `
            <div class="process-header">
                <div class="process-name">${processData.name}</div>
                <div class="process-materials">
                    <div class="inputs">${inputsHtml}</div>
                    <div class="separator"></div>
                    <div class="outputs">${outputsHtml}</div>
                </div>
            </div>
        `;
        el.addEventListener('click', () => this.onClickProcess(processData.i));
        return el;
    }

    private compareProductsByName(p1: I_INPUT_OR_OUTPUT_DATA, p2: I_INPUT_OR_OUTPUT_DATA): number {
        return p1.name.localeCompare(p2.name);
    }

    //// TO DO: rework this function by appending elements, instead of injecting HTML
    private makeInputOrOutputHtml(productId: string, qty: number): string {
        const productData = productService.getProductDataById(productId);
        const el = createEl('div', null, ['product-icon', `-p${productId}`]);
        el.dataset.tooltip = `${productData.name}: ${getFormattedRoundNumber(qty)}`;
        return el.outerHTML;
    }

    private populateElOverlayContent(): void {
        const processorClassName = this.parentProcessor.getProcessorClassName();
        this.elOverlayContent.innerHTML = /*html*/ `
            <div class="overlay-header">
                <div class="overlay-title">Add Process</div>
                <div class="processor ${processorClassName}">
                    <div class="processor-header">
                        <div class="processor-name">${this.parentProcessor.getName()}</div>
                    </div>
                </div>
            </div>
            <div class="overlay-filters">
                <div class="filter-checkboxes">
                    <label><input type="checkbox" checked>Filter by Process</label>
                    <label><input type="checkbox" checked>Filter by Output</label>
                </div>
                <div class="filter-search">
                    <input type="text" placeholder="🔍  Search">
                </div>
            </div>
            <div class="overlay-lists">
                <div class="overlay-list available-inputs">
                    <label class="overlay-list-title" data-tooltip="Startup products, plus outputs from lower industry tiers">
                        <input type="checkbox" checked>Available Inputs
                    </label>
                    <div class="available-inputs-list"></div>
                </div>
                <div class="overlay-list eligible-processes processor ${processorClassName}">
                    <div class="overlay-list-title" data-tooltip="Using only the available inputs for this ${this.parentProcessor.getName()}">
                        Eligible Processes
                    </div>
                    <div class="eligible-processes-list"></div>
                </div>
            </div>
        `;
        this.populateElAvailableInputsList();
        this.populateElEligibleProcessesList();
    }

    protected makeElOverlayContent(): HTMLElement {
        const el = createEl('div', null, ['overlay-add-process']);
        // NOT populating this element yet, because it's created in the "super" constructor, before setting the properties of this class
        return el;
    }
}

export {
    OverlayAddProcess,
}
