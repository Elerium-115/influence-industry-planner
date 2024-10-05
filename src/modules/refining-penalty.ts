import {createEl} from './dom-core.js';
import {processService} from './process-service.js';

// Source: https://wiki.influenceth.io/en/game/crews/crew-bonuses#refinery-secondary-waste-reduction
const PENALTY_FOR_SECONDARY_OUTPUTS_BY_SCIENTISTS_IN_CREW = {
    0: 0.75, // -75%
    1: 0.375, // -37.5%
    2: 0.3, // -30%
    3: 0.273, // -27.3%
    4: 0.261, // -26.1%
    5: 0.255, // -25.5%
};

class RefiningPenalty {
    private scientistsInCrew: number;
    private penaltyForSecondaryOutputs: number;
    private htmlElement: HTMLElement;

    constructor(scientistsInCrew: number) {
        this.setScientistsInCrewAndUpdatePenalty(scientistsInCrew);
        this.htmlElement = this.makeHtmlElement();
    }

    public getHtmlElement(): HTMLElement {
        return this.htmlElement;
    }

    private setScientistsInCrewAndUpdatePenalty(scientistsInCrew: number): void {
        this.scientistsInCrew = scientistsInCrew;
        this.penaltyForSecondaryOutputs = PENALTY_FOR_SECONDARY_OUTPUTS_BY_SCIENTISTS_IN_CREW[scientistsInCrew];
        processService.setPenaltyForSecondaryOutputs(this.penaltyForSecondaryOutputs);
    }

    private makeHtmlElement(): HTMLElement {
        const el = createEl('div', 'refining-penalty');
        el.textContent = `-${this.penaltyForSecondaryOutputs * 100}%`;
        return el;
    }
}

export {
    RefiningPenalty,
}
