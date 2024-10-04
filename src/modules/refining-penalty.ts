import {createEl} from './dom-core.js';
import {processService} from './process-service.js';

const DEFAULT_PENALTY_FOR_SECONDARY_OUTPUTS: number = 0.375; // 1 scientist in refining teams

class RefiningPenalty {
    private penaltyForSecondaryOutputs: number;
    private htmlElement: HTMLElement;

    constructor(penaltyForSecondaryOutputs: number) {
        this.penaltyForSecondaryOutputs = penaltyForSecondaryOutputs;
        processService.setPenaltyForSecondaryOutputs(penaltyForSecondaryOutputs);
        this.htmlElement = this.makeHtmlElement();
    }

    public getPenaltyForSecondaryOutputs(): number {
        return this.penaltyForSecondaryOutputs;
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
    DEFAULT_PENALTY_FOR_SECONDARY_OUTPUTS,
    RefiningPenalty,
}
