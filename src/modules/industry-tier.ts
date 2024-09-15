import {createEl} from './dom-core.js';
import {Processor} from './processor.js';

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

    public removeProcessor(processorToRemove: Processor): void {
        //// TO DO: test / how to implement this, if not working as below?
        this.processors = this.processors.filter(processor => processor === processorToRemove);
    }

    public getHtmlElement(): HTMLElement {
        return this.htmlElement;
    }

    public makeHtmlElement(): HTMLElement {
        const el = createEl('div', null, ['industry-tier']);
        el.dataset.title = this.title;
        return el;
    }
}

export {
    IndustryTier,
}
