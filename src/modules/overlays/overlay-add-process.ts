import {createEl} from '../dom-core.js';
import {OverlayAbstract} from './overlay-abstract';
import {industryPlanService} from '../industry-plan-service.js';
import {IndustryTier} from '../industry-tier.js';
import {Processor} from '../processor.js';

class OverlayAddProcess extends OverlayAbstract {
    private parentIndustryTier: IndustryTier;
    private parentProcessor: Processor;

    constructor(parentProcessor: Processor, parentIndustryTier: IndustryTier) {
        super();

        this.parentIndustryTier = parentIndustryTier;
        this.parentProcessor = parentProcessor;
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
        industryPlanService.getAvailableInputsForIndustryTier(this.parentIndustryTier).forEach(product => {
            listHtml += /*html*/ `
                <label>
                    <input type="checkbox" checked>
                    <div class="product-icon -p${product.getId()}" data-tooltip="${product.getName()}"></div>
                    <div class="product-name">${product.getName()}</div>
                </label>
            `;
        });
        this.getElAvailableInputsList().innerHTML = listHtml;
        //// TO DO: add logic for toggling checkboxes => filter eligible processes
    }

    private populateElEligibleProcessesList(): void {
        let listHtml = '';
        //// TO DO: ...
        this.getElEligibleProcessesList().innerHTML = listHtml;
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
