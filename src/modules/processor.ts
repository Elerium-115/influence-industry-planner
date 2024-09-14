import {createEl} from './dom-core.js';
import {Process} from './process.js';

/**
 * NOTE:
 * - This corresponds to the building IDs from the Influence SDK, not the processor IDs.
 * - The mapping between them is not formalized in the SDK, as of September 2024.
 * 
 * Source: Influence SDK - "src/lib/building.js"
 */
const PROCESSOR_IDS = {
    EMPTY_LOT: 0, // SDK processor: CONSTRUCTION
    EXTRACTOR: 2, // SDK processor: N/A
    REFINERY: 3, // SDK processor: REFINERY
    BIOREACTOR: 4, // SDK processor: BIOREACTOR
    FACTORY: 5, // SDK processor: FACTORY
    SHIPYARD: 6, // SDK processors: SHIPYARD, DRY_DOCK
}

type TYPE_PROCESSOR_IDS = typeof PROCESSOR_IDS[keyof typeof PROCESSOR_IDS];

const PROCESSOR_NAMES = {
    [PROCESSOR_IDS.EMPTY_LOT]: 'Empty Lot',
    [PROCESSOR_IDS.EXTRACTOR]: 'Extractor',
    [PROCESSOR_IDS.REFINERY]: 'Refinery',
    [PROCESSOR_IDS.BIOREACTOR]: 'Bioreactor',
    [PROCESSOR_IDS.FACTORY]: 'Factory',
    [PROCESSOR_IDS.SHIPYARD]: 'Shipyard',
}

class Processor {
    private id: TYPE_PROCESSOR_IDS;
    private processes: Process[] = [];
    private htmlElement: HTMLElement;

    constructor(id: TYPE_PROCESSOR_IDS) {
        this.id = id;
        this.htmlElement = this.makeHtmlElement();
    }

    public getId(): TYPE_PROCESSOR_IDS {
        return this.id;
    }

    public getName(): string {
        return PROCESSOR_NAMES[this.id] as string;
    }

    public getProcesses(): Process[] {
        return this.processes;
    }

    public getHtmlElement(): HTMLElement {
        return this.htmlElement;
    }

    public remove(): void {
        this.htmlElement.parentElement?.removeChild(this.htmlElement);
        //// TO DO: also remove this class instance from the parent "IndustryTier"
    }

    public makeHtmlElement(): HTMLElement {
        const el = createEl('div', null, ['processor']);
        const processorClassName = this.getName().toLowerCase().replace(/\s+/g, '-'); // e.g. "empty-lot"
        const lotId = 1234; //// TEST
        const asteroidName = 'Adalia Prime'; //// TEST
        el.classList.add(`-${processorClassName}`);
        el.innerHTML = /*html*/ `
            <div class="processor-header">
                <div class="processor-name">${this.getName()}</div>
                <div class="processor-info" data-tooltip="Lot #${lotId} > ${asteroidName}"></div>
                <div class="remove-processor"></div>
            </div>
            <div class="processes">
                <!-- ADD -->
                <div class="process add-process">
                    <div class="process-header">
                        <div class="process-name"></div>
                    </div>
                </div>
            </div>
        `;
        el.querySelector('.remove-processor')?.addEventListener('click', this.remove.bind(this));
        return el;
    }
}

export {
    PROCESSOR_IDS,
    type TYPE_PROCESSOR_IDS,
    Processor,
}
