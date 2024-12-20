import {createEl, getItemNameSafe} from './abstract-core.js';
import {IndustryTier} from './industry-tier.js';
import {
    PROCESSOR_BUILDING_IDS,
    type TYPE_PROCESSOR_BUILDING_IDS,
    processorService,
} from './processor-service.js';

class AddProcessorPanel {
    private parentIndustryTier: IndustryTier;
    private dropdownHtmlElement: HTMLElement;
    private htmlElement: HTMLElement;

    constructor(parentIndustryTier: IndustryTier) {
        this.parentIndustryTier = parentIndustryTier;
        this.htmlElement = this.makeHtmlElement();
    }

    public getHtmlElement(): HTMLElement {
        return this.htmlElement;
    }

    private onClickDropdownOption(buildingId: TYPE_PROCESSOR_BUILDING_IDS): void {
        // Force the dropdown to be hidden, before adding the new processor
        this.dropdownHtmlElement.classList.add('hidden');
        this.parentIndustryTier.addProcessorById(buildingId);
        // Stop forcing the dropdown to be hidden (via setTimeout to allow it time to first become hidden)
        setTimeout(() => this.dropdownHtmlElement.classList.remove('hidden'));
    }

    private makeDropdownOptionHtmlElement(buildingId: TYPE_PROCESSOR_BUILDING_IDS): HTMLElement {
        const buildingName = processorService.getBuildingName(buildingId);
        const processorClassName = `-${getItemNameSafe(buildingName)}`; // e.g. "-empty-lot"
        const el = createEl('div', null, ['option', processorClassName]);
        el.textContent = buildingName;
        el.addEventListener('click', () => this.onClickDropdownOption(buildingId));
        return el;
    }

    private makeDropdownHtmlElement(): HTMLElement {
        const el = createEl('div', null, ['add-processor-dropdown']);
        Object.values(PROCESSOR_BUILDING_IDS).forEach((buildingId: TYPE_PROCESSOR_BUILDING_IDS) => {
            el.append(this.makeDropdownOptionHtmlElement(buildingId));
        });
        return el;
    }

    private makeHtmlElement(): HTMLElement {
        const el = createEl('div', null, ['add-processor-panel']);
        this.dropdownHtmlElement = this.makeDropdownHtmlElement();
        el.append(this.dropdownHtmlElement);
        return el;
    }

}

export {
    AddProcessorPanel,
}
