import {createEl} from '../dom-core.js';
import {OverlayAbstract} from './overlay-abstract';
import {industryPlanService} from '../industry-plan-service.js';
import {IndustryTier} from '../industry-tier.js';
import {Processor} from '../processor.js';
import {I_PROCESS_DATA} from '../process-service.js';
import {ProductAbstract} from '../product-abstract.js';
import {productService} from '../product-service.js';

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
        //// TO DO: add logic for toggling inputs-checkboxes + filters-checkboxes + search =>  filter eligible processes
    }

    private populateElEligibleProcessesList(): void {
        this.eligibleProcesses.forEach(processData => {
            this.getElEligibleProcessesList().append(this.makeElEligibleProcess(processData));
        });
    }

    private makeElEligibleProcess(processData: I_PROCESS_DATA): HTMLElement {
        let inputsHtml = '';
        let outputsHtml = '';
        for (const [productId, qty] of Object.entries(processData.inputs)) {
            inputsHtml += this.makeInputOrOutputHtml(productId, qty);
        }
        for (const [productId, qty] of Object.entries(processData.outputs)) {
            outputsHtml += this.makeInputOrOutputHtml(productId, qty);
        }
        const el = createEl('div', null, ['process']);
        el.innerHTML = /*html*/ `
            <div class="process-header">
                <div class="process-name">${processData.name}</div>
            </div>
            <div class="process-materials">
                <div class="inputs">${inputsHtml}</div>
                <div class="separator"></div>
                <div class="outputs">${outputsHtml}</div>
            </div>
        `;
        //// TO DO: on click => ADD this process into "parentProcessor"
        return el;
    }

    //// TO DO: rework this function by appending elements, instead of injecting HTML
    private makeInputOrOutputHtml(productId: string, qty: number): string {
        const productData = productService.getProductDataById(productId);
        const el = createEl('div', null, ['product-icon', `-p${productId}`]);
        el.dataset.tooltip = `${productData.name}: ${qty}`;
        return el.outerHTML;
    }

    private populateElOverlayContent(): void {
        this.elOverlayContent.innerHTML = /*html*/ `
            <div class="overlay-header">
                <div class="overlay-title">Add Process</div>
                <div class="processor ${this.parentProcessor.getProcessorClassName()}">
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
                <div class="overlay-list eligible-processes">
                    <div class="overlay-list-title ${this.parentProcessor.getProcessorClassName()}" data-tooltip="Using only the available inputs for this ${this.parentProcessor.getName()}">
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
