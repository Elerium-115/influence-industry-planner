import {getItemNameSafe} from './abstract-core.js';
import {createEl} from './dom-core.js';
import {IndustryTier} from './industry-tier.js';
import {
    PROCESSOR_BUILDING_IDS,
    type TYPE_PROCESSOR_BUILDING_IDS,
    processorService,
} from './processor-service.js';

class AddProcessorPanel {
    private industryTier: IndustryTier;
    private dropdownHtmlElement: HTMLElement;
    private htmlElement: HTMLElement;

    constructor(industryTier: IndustryTier) {
        this.industryTier = industryTier;
        this.htmlElement = this.makeHtmlElement();
    }

    public getHtmlElement(): HTMLElement {
        return this.htmlElement;
    }

    private onClickDropdownOption(buildingId: TYPE_PROCESSOR_BUILDING_IDS): void {
        // Force the dropdown to be hidden, before adding the new processor
        this.dropdownHtmlElement.classList.add('hidden');
        this.industryTier.addProcessorById(buildingId);
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
        //// TO DO: on "mouseenter" => ensure the dropdown is fully visible (e.g. scroll-down if needed)
        el.append(this.dropdownHtmlElement);
        return el;
    }

}

export {
    AddProcessorPanel,
}
