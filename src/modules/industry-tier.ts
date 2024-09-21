import {createEl} from './dom-core.js';
import {IndustryPlan} from './industry-plan.js';
import {Processor} from './processor.js';
import {type TYPE_PROCESSOR_BUILDING_IDS} from './processor-service.js';
import {AddProcessorPanel} from './add-processor-panel.js';

class IndustryTier {
    private title: string;
    private parentIndustryPlan: IndustryPlan;
    private processors: Processor[] = [];
    private addProcessorPanel: AddProcessorPanel;
    private htmlElement: HTMLElement;

    constructor(title: string, parentIndustryPlan: IndustryPlan) {
        this.title = title;
        this.parentIndustryPlan = parentIndustryPlan;
        this.htmlElement = this.makeHtmlElement();
    }

    public getProcessors(): Processor[] {
        return this.processors;
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
        const processor = new Processor(processorId, this);
        this.processors.push(processor);
        // Add new processor into the DOM
        this.getElProcessorsList().append(processor.getHtmlElement());
        this.parentIndustryPlan.onIndustryTierPopulated(this);
        return processor;
    }

    public onProcessorRemoved(processorRemoved: Processor): void {
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
        this.parentIndustryPlan.onIndustryTierRemoved(this);
    }
}

export {
    IndustryTier,
}
