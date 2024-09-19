import {createEl} from './dom-core.js';
import {EVENT_INDUSTRY_TIER, industryTierService} from './industry-tier-service.js';
import {Processor} from './processor.js';
import {
    EVENT_PROCESSOR,
    type TYPE_PROCESSOR_BUILDING_IDS,
    processorService,
} from './processor-service.js';
import {AddProcessorPanel} from './add-processor-panel.js';

class IndustryTier {
    private title: string;
    private processors: Processor[] = [];
    private addProcessorPanel: AddProcessorPanel;
    private htmlElement: HTMLElement;

    constructor(title: string) {
        this.title = title;
        this.htmlElement = this.makeHtmlElement();
        // Listen for events
        processorService.addEventListener(
            EVENT_PROCESSOR.PROCESSOR_REMOVED,
            this.onProcessorRemoved.bind(this)
        );
    }

    public getHtmlElement(): HTMLElement {
        return this.htmlElement;
    }

    private getElProcessorsList(): HTMLElement {
        // Always "HTMLElement", never "null"
        return this.htmlElement.querySelector('.processors-list') as HTMLElement;
    }

    public setTitle(title: string): void {
        this.title = title;
        const elTitle = this.htmlElement.querySelector('.industry-tier-title') as HTMLElement;
        elTitle.dataset.title = title;
    }

    public addProcessorById(processorId: TYPE_PROCESSOR_BUILDING_IDS): Processor {
        const processor = new Processor(processorId);
        this.processors.push(processor);
        // Add new processor into the DOM
        this.getElProcessorsList().append(processor.getHtmlElement());
        industryTierService.emit(EVENT_INDUSTRY_TIER.INDUSTRY_TIER_POPULATED, this);
        return processor; //// TO DO: remove this "return" after no longer needed for "test.ts"
    }

    private onProcessorRemoved(event: Event) {
        /**
         * NOTE: This is triggered in ALL industry tiers,
         * when a processor from ANY industry tier is removed.
         */
        const processorRemoved = (event as CustomEvent).detail;
        if (!this.processors.includes(processorRemoved)) {
            // Event irrelevant for this industry tier
            return;
        }
        this.processors = this.processors.filter(processor => processor !== processorRemoved);
        if (!this.processors.length) {
            // All processors removed => remove this industry tier
            this.remove();
        }
    }

    private makeHtmlElement(): HTMLElement {
        const el = createEl('div', null, ['industry-tier']);
        el.innerHTML = /*html*/ `
            <div class="industry-tier-title" data-title="${this.title}"></div>
            <div class="processors-list"></div>
        `;
        // Inject add-processor panel
        this.addProcessorPanel = new AddProcessorPanel(this);
        el.append(this.addProcessorPanel.getHtmlElement());
        return el;
    }

    private remove(): void {
        this.htmlElement.parentElement?.removeChild(this.htmlElement);
        industryTierService.emit(EVENT_INDUSTRY_TIER.INDUSTRY_TIER_REMOVED, this);
    }
}

export {
    IndustryTier,
}
