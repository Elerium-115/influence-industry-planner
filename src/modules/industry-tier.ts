import {createEl} from './dom-core.js';
import {Processor} from './processor.js';
import {type TYPE_PROCESSOR_BUILDING_IDS} from './processor-service.js';

class IndustryTier {
    private title: string;
    private processors: Processor[] = [];
    private htmlElement: HTMLElement;

    constructor(title: string) {
        this.title = title;
        this.htmlElement = this.makeHtmlElement();
    }

    public getProcessors(): Processor[] {
        return this.processors;
    }

    public getHtmlElement(): HTMLElement {
        return this.htmlElement;
    }

    public getElProcessorsList(): HTMLElement {
        // Always "HTMLElement", never "null"
        return this.htmlElement.querySelector('.processors-list') as HTMLElement;
    }

    public addProcessorById(processorId: TYPE_PROCESSOR_BUILDING_IDS): Processor {
        const processor = new Processor(processorId);
        this.processors.push(processor);
        this.getElProcessorsList().append(processor.getHtmlElement());
        //// TO DO: emit event => handle @ "IndustryPlan" by auto-adding a new (empty) industry-tier
        return processor;
    }

    public removeProcessor(processorToRemove: Processor): void {
        this.processors = this.processors.filter(processor => processor === processorToRemove);
        //// TO DO: emit event => handle @ "IndustryPlan" by auto-removing trailing industry-tier(s), if multiple EMPTY ones
    }

    private onClickAddProcessorButton(): void {
        console.log(`--- [onClickAddProcessorButton]`); //// TEST
    }

    public makeHtmlElement(): HTMLElement {
        const el = createEl('div', null, ['industry-tier']);
        el.innerHTML = /*html*/ `
            <div class="industry-tier-title" data-title="${this.title}"></div>
            <div class="processors-list"></div>
            <div class="add-processor-button"></div>
        `;
        el.querySelector('.add-processor-button')?.addEventListener('click', this.onClickAddProcessorButton.bind(this));
        return el;
    }
}

export {
    IndustryTier,
}
