import {getItemNameSafe} from '../abstract-core.js';
import {createEl} from '../dom-core.js';
import {OverlayAbstract} from './overlay-abstract.js';
import {IndustryTier} from '../industry-tier.js';
import {
    PROCESSOR_BUILDING_IDS,
    type TYPE_PROCESSOR_BUILDING_IDS,
    processorService,
} from '../processor-service.js';

class OverlayAddProcessor extends OverlayAbstract {
    private industryTier: IndustryTier;

    constructor(industryTier: IndustryTier) {
        super();

        this.industryTier = industryTier;
    }

    private onClickProcessorButton(buildingId: TYPE_PROCESSOR_BUILDING_IDS): void {
        this.industryTier.addProcessorById(buildingId);
        this.remove();
    }

    private makeElProcessorButton(buildingId: TYPE_PROCESSOR_BUILDING_IDS): HTMLElement {
        const buildingName = processorService.getBuildingName(buildingId);
        const processorClassName = `-${getItemNameSafe(buildingName)}`; // e.g. "-empty-lot"
        const el = createEl('div', null, ['button', processorClassName]);
        el.addEventListener('click', () => this.onClickProcessorButton(buildingId));
        el.textContent = buildingName;
        return el;
    }

    protected makeContentHtmlElement(): HTMLElement {
        const el = createEl('div', null, ['overlay-add-processor']);
        Object.values(PROCESSOR_BUILDING_IDS).forEach((buildingId: TYPE_PROCESSOR_BUILDING_IDS) => {
            el.append(this.makeElProcessorButton(buildingId));
        });
        return el;
    }
}

export {
    OverlayAddProcessor,
}
