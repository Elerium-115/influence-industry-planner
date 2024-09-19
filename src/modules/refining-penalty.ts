import {createEl} from './dom-core.js';
import {processService} from './process-service.js';

class RefiningPenalty {
    private penaltyForSecondaryOutputs: number = 0.375; // 1 scientist in refining teams
    private htmlElement: HTMLElement;

    constructor() {
        processService.setPenaltyForSecondaryOutputs(this.penaltyForSecondaryOutputs);
        this.htmlElement = this.makeHtmlElement();
    }

    public getHtmlElement(): HTMLElement {
        return this.htmlElement;
    }

    private makeHtmlElement(): HTMLElement {
        const el = createEl('div', 'refining-penalty', ['-refinery']);
        el.textContent = `-${this.penaltyForSecondaryOutputs * 100}%`;
        return el;
    }
}

export {
    RefiningPenalty,
}
