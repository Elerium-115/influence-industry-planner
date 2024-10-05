import {createEl} from './dom-core.js';
import {IndustryPlan} from './industry-plan.js';
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
    private parentIndustryPlan: IndustryPlan;
    private scientistsInCrew: number;
    private penaltyForSecondaryOutputs: number;
    private htmlElement: HTMLElement;

    constructor(scientistsInCrew: number, parentIndustryPlan: IndustryPlan) {
        this.parentIndustryPlan = parentIndustryPlan;
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

    private onClickScientistsCount(scientistsInCrew: number): void {
        if (this.scientistsInCrew === scientistsInCrew) {
            return;
        }
        this.setScientistsInCrewAndUpdatePenalty(scientistsInCrew);
        // Mark the selected scientists-count
        ([...this.htmlElement.querySelectorAll('.scientists-count')] as HTMLElement[]).forEach(el => {
            el.classList.toggle('selected', scientistsInCrew === Number(el.textContent));
        });
        // Update the industry plan, based on the new "scientistsInCrew"
        this.parentIndustryPlan.setScientistsInCrew(scientistsInCrew);
    }

    private makeElScientistsCount(scientistsInCrew: number): HTMLElement {
        const el = createEl('div', null, ['scientists-count']);
        if (scientistsInCrew === 0) {
            el.classList.add('warning-if-selected');
        }
        el.classList.toggle('selected', scientistsInCrew === this.scientistsInCrew);
        el.textContent = scientistsInCrew.toString();
        const penalty = PENALTY_FOR_SECONDARY_OUTPUTS_BY_SCIENTISTS_IN_CREW[scientistsInCrew];
        el.dataset.tooltipPosition = 'bottom-left';
        el.dataset.tooltip = `Refining penalty for secondary outputs: -${penalty * 100}%`;
        el.addEventListener('click', () => this.onClickScientistsCount(scientistsInCrew));
        return el;
    }

    private makeHtmlElement(): HTMLElement {
        const el = createEl('div', 'refining-penalty');
        // Add options to select number of scientists in crew, between 0 and 5
        for (let i = 0; i <= 5; i++) {
            el.append(this.makeElScientistsCount(i));
        }
        return el;
    }
}

export {
    RefiningPenalty,
}
