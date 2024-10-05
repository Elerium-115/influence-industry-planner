import {getFormattedRoundNumber} from '../abstract-core.js';
import {createEl} from '../dom-core.js';
import {OverlayAbstract} from './overlay-abstract';
import {industryPlanService} from '../industry-plan-service.js';
import {IndustryTier} from '../industry-tier.js';
import {Processor} from '../processor.js';
import {PROCESSOR_BUILDING_IDS} from '../processor-service.js';
import {I_PROCESS_DATA} from '../process-service.js';
import {ProductSelectable} from '../product-selectable.js';
import {productService} from '../product-service.js';

interface I_INPUT_OR_OUTPUT_DATA {
    name: string,
    productId: string,
    qty: number,
}

class OverlayAddProcess extends OverlayAbstract {
    private parentIndustryTier: IndustryTier;
    private parentProcessor: Processor;
    private availableInputs: ProductSelectable[] = [];
    private eligibleProcesses: I_PROCESS_DATA[] = [];
    private elAvailableInputsList: HTMLElement;
    private elEligibleProcessesList: HTMLElement;
    private elInputToggleAllAvailableInputs: HTMLInputElement;
    private elInputFilterByProcess: HTMLInputElement;
    private elInputFilterByOutput: HTMLInputElement;
    private elInputFilterSearch: HTMLInputElement;

    constructor(parentProcessor: Processor, parentIndustryTier: IndustryTier) {
        super();

        this.parentIndustryTier = parentIndustryTier;
        this.parentProcessor = parentProcessor;
        this.availableInputs = industryPlanService.getAvailableInputsForIndustryTier(this.parentIndustryTier);
        this.populateElOverlayContent();
    }

    private onClickProcess(processId: number): void {
        this.parentProcessor.addProcessById(processId);
        this.remove();
    }

    private onChangeFilterByProcess(): void {
        if (!this.elInputFilterByProcess.checked) {
            // Force-check the other checkbox (this will NOT trigger its "onchange" handler)
            this.elInputFilterByOutput.checked = true;
        }
        this.filterProcesses();
    }

    private onChangeFilterByOutput(): void {
        if (!this.elInputFilterByOutput.checked) {
            // Force-check the other checkbox (this will NOT trigger its "onchange" handler)
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
            // Filter by search only if search-query NOT empty, and at least one of the filter-checkboxes is checked
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

    private onChangeToggleAllAvailableInputs(event: InputEvent) {
        const elToggleAllInput = event.target as HTMLInputElement;
        // Force-check/uncheck each available input (this will NOT trigger its "onchange" handler)
        ([...this.elAvailableInputsList.querySelectorAll('input[type="checkbox"]')] as HTMLInputElement[]).forEach(elInput => {
            elInput.checked = elToggleAllInput.checked;
            // Manually trigger the "onchange" handler, without updating the processes
            (elInput as HTMLElement).dispatchEvent(new InputEvent('change'));
        });
        // Update the processes only after all inputs have been checked/unchecked
        this.updateAndRenderEligibleProcesses();
        this.filterProcesses();
    }

    private onChangeAvailableInput(event: InputEvent, shouldUpdateProcesses: boolean = true) {
        const elInput = event.target as HTMLInputElement;
        const productId = (elInput.closest('label') as HTMLElement).dataset.productId as string;
        const availableInput = this.availableInputs.find(product => product.getId() === productId);
        availableInput?.setIsSelected(elInput.checked);
        if (shouldUpdateProcesses) {
            this.updateAndRenderEligibleProcesses();
            this.filterProcesses();
        }
    }

    private populateElAvailableInputsList(): void {
        this.availableInputs.forEach(product => {
            const el = createEl('label');
            el.dataset.productId = product.getId()?.toString();
            el.innerHTML += /*html*/ `
                <input type="checkbox" checked>
                <div class="product-icon -p${product.getId()}" data-tooltip-position="top-left" data-tooltip="${product.getName()}"></div>
                <div class="product-name">${product.getName()}</div>
            `;
            el.querySelector('input[type="checkbox"]')?.addEventListener('change', this.onChangeAvailableInput.bind(this));
            this.elAvailableInputsList.append(el);
        });
    }

    private updateAndRenderEligibleProcesses(): void {
        // Update the eligible processes, using the currently-selected available-inputs
        this.eligibleProcesses = industryPlanService.getEligibleProcessesForProcessorUsingInputs(this.parentProcessor, this.availableInputs);
        // (Re-)render the list of eligible processes
        this.elEligibleProcessesList.textContent = '';
        this.eligibleProcesses.forEach(processData => {
            this.elEligibleProcessesList.append(this.makeElEligibleProcess(processData));
        });
    }

    private makeElEligibleProcess(processData: I_PROCESS_DATA): HTMLElement {
        const el = createEl('div', null, ['process']);
        el.innerHTML = /*html*/ `
            <div class="process-header">
                <div class="process-name">${processData.name}</div>
                <div class="process-materials">
                    <div class="inputs"></div>
                    <div class="separator"></div>
                    <div class="outputs"></div>
                </div>
            </div>
        `;
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
        // Add inputs and outputs into the DOM
        const elInputs = el.querySelector('.inputs') as HTMLElement;
        const elOutputs = el.querySelector('.outputs') as HTMLElement;
        inputsDataList.forEach(inputData => {
            elInputs.append(this.makeElInputOrOutput(inputData.productId, inputData.qty));
        });
        outputsDataList.forEach(outputData => {
            elOutputs.append(this.makeElInputOrOutput(outputData.productId, outputData.qty));
        });
        // Set data for filtering by process / output
        el.dataset.processName = processData.name;
        el.dataset.outputsNames = JSON.stringify(outputsDataList.map(outputData => outputData.name));
        el.addEventListener('click', () => this.onClickProcess(processData.i));
        return el;
    }

    private compareProductsByName(p1: I_INPUT_OR_OUTPUT_DATA, p2: I_INPUT_OR_OUTPUT_DATA): number {
        return p1.name.localeCompare(p2.name);
    }

    private makeElInputOrOutput(productId: string, qty: number): HTMLElement {
        const el = createEl('div', null, ['product-icon', `-p${productId}`]);
        el.dataset.tooltipPosition = 'top-right';
        el.dataset.tooltip = `${productService.getProductNameById(productId)}: ${getFormattedRoundNumber(qty)}`;
        return el;
    }

    private populateElOverlayContent(): void {
        const overlayTitle = this.parentProcessor.getId() === PROCESSOR_BUILDING_IDS.EMPTY_LOT ? 'Add Construction' : 'Add Process';
        const processorClassName = this.parentProcessor.getProcessorClassName();
        this.elOverlayContent.innerHTML = /*html*/ `
            <div class="overlay-header">
                <div class="overlay-title">${overlayTitle}</div>
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
                    <label class="overlay-list-title" data-tooltip-position="top-left" data-tooltip="Startup products, plus outputs from lower industry tiers">
                        <input type="checkbox" name="toggle-all-available-inputs" checked>Available Inputs
                    </label>
                    <div class="available-inputs-list"></div>
                </div>
                <div class="overlay-list eligible-processes processor ${processorClassName}">
                    <div class="overlay-list-title" data-tooltip-position="top-right" data-tooltip="Using only the available inputs for this ${this.parentProcessor.getName()}">
                        Eligible Processes
                    </div>
                    <div class="eligible-processes-list"></div>
                </div>
            </div>
        `;
        this.elInputToggleAllAvailableInputs = this.elOverlayContent.querySelector('input[name="toggle-all-available-inputs"]') as HTMLInputElement;
        this.elAvailableInputsList = this.elOverlayContent.querySelector('.available-inputs-list') as HTMLElement;
        this.elEligibleProcessesList = this.elOverlayContent.querySelector('.eligible-processes-list') as HTMLElement;
        this.elInputFilterByProcess = this.elOverlayContent.querySelector('input[name="filter-by-process"]') as HTMLInputElement;
        this.elInputFilterByOutput = this.elOverlayContent.querySelector('input[name="filter-by-output"]') as HTMLInputElement;
        this.elInputFilterSearch = this.elOverlayContent.querySelector('input[name="filter-search"]') as HTMLInputElement;
        this.elInputToggleAllAvailableInputs.addEventListener('change', this.onChangeToggleAllAvailableInputs.bind(this));
        this.elInputFilterByProcess.addEventListener('change', this.onChangeFilterByProcess.bind(this));
        this.elInputFilterByOutput.addEventListener('change', this.onChangeFilterByOutput.bind(this));
        this.elInputFilterSearch.addEventListener('input', this.onInputFilterSearch.bind(this));
        // Explicit focus re: HTML property "autofocus" NOT working as expected, if already triggered in a previous overlay
        this.elInputFilterSearch.focus();
        this.populateElAvailableInputsList();
        this.updateAndRenderEligibleProcesses();
    }

    protected makeElOverlayContent(): HTMLElement {
        const el = createEl('div', null, ['overlay-content-inner', 'overlay-add-process']);
        // NOT populating this element yet, because it's created in the "super" constructor, before setting the properties of this class
        return el;
    }
}

export {
    OverlayAddProcess,
}
