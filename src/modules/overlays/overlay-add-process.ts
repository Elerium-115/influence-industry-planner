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
    private elAvailableInputsList: HTMLElement;
    private elEligibleProcessesList: HTMLElement;
    private elInputFilterByProcess: HTMLInputElement;
    private elInputFilterByOutput: HTMLInputElement;
    private elInputFilterSearch: HTMLInputElement;

    constructor(parentProcessor: Processor, parentIndustryTier: IndustryTier) {
        super();

        this.parentIndustryTier = parentIndustryTier;
        this.parentProcessor = parentProcessor;
        this.availableInputs = industryPlanService.getAvailableInputsForIndustryTier(this.parentIndustryTier);
        this.eligibleProcesses = industryPlanService.getEligibleProcessesForProcessorUsingInputs(this.parentProcessor, this.availableInputs);
        this.populateElOverlayContent();
    }

    private onClickProcess(processId: number): void {
        this.parentProcessor.addProcessById(processId);
        this.remove();
    }

    private onChangeFilterByProcess(): void {
        if (!this.elInputFilterByProcess.checked) {
            // Force-check the other checkbox (this will NOT trigger its "oninput" handler)
            this.elInputFilterByOutput.checked = true;
        }
        this.filterProcesses();
    }

    private onChangeFilterByOutput(): void {
        if (!this.elInputFilterByOutput.checked) {
            // Force-check the other checkbox (this will NOT trigger its "oninput" handler)
            this.elInputFilterByProcess.checked = true;
        }
        this.filterProcesses();
    }

    private onInputFilterSearch(): void {
        this.filterProcesses();
    }

    private filterProcesses(): void {
        const isFilteringByProcess = this.elInputFilterByProcess.checked;
        const isFilteringByOutputs = this.elInputFilterByOutput.checked;
        const searchQueryLowercase = this.elInputFilterSearch.value.toLowerCase().trim();
        ([...this.elEligibleProcessesList.children] as HTMLElement[]).forEach(elProcess => {
            let isVisibleBySearch = false;
            // Filter by search only if search-string NOT empty, and at least one of the filter-checkboxes is checked
            if (searchQueryLowercase && (isFilteringByProcess || isFilteringByOutputs)) {
                if (isFilteringByProcess) {
                    // Consider the process name only if this checkbox is checked
                    const processName = elProcess.dataset.processName as string;
                    const isMatchingProcessName = processName.toLowerCase().includes(searchQueryLowercase);
                    isVisibleBySearch = isVisibleBySearch || isMatchingProcessName;
                }
                if (isFilteringByOutputs) {
                    // Consider the outputs names only if this checkbox is checked
                    const outputsNames = JSON.parse(elProcess.dataset.outputsNames as string) as string[];
                    const isMatchingOutputName = outputsNames.some(outputName => outputName.toLowerCase().includes(searchQueryLowercase));
                    isVisibleBySearch = isVisibleBySearch || isMatchingOutputName;
                }
            } else {
                // Not filtering by search
                isVisibleBySearch = true;
            }
            elProcess.classList.toggle('hidden', !isVisibleBySearch);
        });
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
        this.elAvailableInputsList.innerHTML = listHtml;
        //// TO DO: add logic for toggling inputs-checkboxes + filters-checkboxes + search => filter eligible processes
    }

    private populateElEligibleProcessesList(): void {
        this.eligibleProcesses.forEach(processData => {
            this.elEligibleProcessesList.append(this.makeElEligibleProcess(processData));
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
        el.dataset.processName = processData.name;
        el.dataset.outputsNames = JSON.stringify(outputsDataList.map(outputData => outputData.name));
        el.addEventListener('click', () => this.onClickProcess(processData.i));
        return el;
    }

    private compareProductsByName(p1: I_INPUT_OR_OUTPUT_DATA, p2: I_INPUT_OR_OUTPUT_DATA): number {
        return p1.name.localeCompare(p2.name);
    }

    //// TO DO: rework this function by appending elements, instead of injecting HTML
    private makeInputOrOutputHtml(productId: string, qty: number): string {
        const el = createEl('div', null, ['product-icon', `-p${productId}`]);
        el.dataset.tooltip = `${productService.getProductNameById(productId)}: ${getFormattedRoundNumber(qty)}`;
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
                    <label><input type="checkbox" name="filter-by-process" checked>Filter by Process</label>
                    <label><input type="checkbox" name="filter-by-output" checked>Filter by Output</label>
                </div>
                <div class="filter-search">
                    <input type="text" name="filter-search" placeholder="🔍  Search">
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
        this.elAvailableInputsList = this.elOverlayContent.querySelector('.available-inputs-list') as HTMLElement;
        this.elEligibleProcessesList = this.elOverlayContent.querySelector('.eligible-processes-list') as HTMLElement;
        this.elInputFilterByProcess = this.elOverlayContent.querySelector('input[name="filter-by-process"]') as HTMLInputElement;
        this.elInputFilterByOutput = this.elOverlayContent.querySelector('input[name="filter-by-output"]') as HTMLInputElement;
        this.elInputFilterSearch = this.elOverlayContent.querySelector('input[name="filter-search"]') as HTMLInputElement;
        this.elInputFilterByProcess.addEventListener('change', this.onChangeFilterByProcess.bind(this));
        this.elInputFilterByOutput.addEventListener('change', this.onChangeFilterByOutput.bind(this));
        this.elInputFilterSearch.addEventListener('input', this.onInputFilterSearch.bind(this));
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
