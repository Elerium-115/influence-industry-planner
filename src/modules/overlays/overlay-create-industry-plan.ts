import {createEl} from '../dom-core.js';
import {OverlayAbstract} from './overlay-abstract';
import {IndustryPlan} from '../industry-plan.js';
import {industryPlanService} from '../industry-plan-service.js';

class OverlayCreateIndustryPlan extends OverlayAbstract {
    private elInputPlanTitle: HTMLInputElement;
    private elCreatePlanButton: HTMLElement;

    constructor() {
        super();

        this.populateElOverlayContent();
    }

    private onInputPlanTitle(): void {
        const planTitle = this.elInputPlanTitle.value.trim();
        this.elCreatePlanButton.classList.toggle('disabled', !planTitle.length);
        this.elOverlayContent.classList.remove('invalid-title');
    }

    private onClickCreatePlanButton(): void {
        const planTitle = this.elInputPlanTitle.value.trim();
        if (industryPlanService.isReservedPlanTitle(planTitle)) {
            this.elOverlayContent.classList.add('invalid-title');
            return;
        }
        new IndustryPlan(planTitle);
        this.remove();
    }

    private populateElOverlayContent(): void {
        this.elOverlayContent.innerHTML = /*html*/ `
            <div class="overlay-header">
                <div class="overlay-title">Create Industry Plan</div>
            </div>
            <div class="overlay-input">
                <input type="text" name="plan-title" placeholder="Plan Title">
            </div>
            <div class="overlay-cta">
                <div class="create-plan-button disabled">Create Plan</div>
            </div>
        `;
        this.elInputPlanTitle = this.elOverlayContent.querySelector('input[name="plan-title"]') as HTMLInputElement;
        this.elCreatePlanButton = this.elOverlayContent.querySelector('.create-plan-button') as HTMLElement;
        this.elInputPlanTitle.addEventListener('input', this.onInputPlanTitle.bind(this));
        this.elCreatePlanButton.addEventListener('click', this.onClickCreatePlanButton.bind(this));
        // Explicit focus re: HTML property "autofocus" NOT working as expected, if already triggered in a previous overlay
        this.elInputPlanTitle.focus();
    }

    protected makeElOverlayContent(): HTMLElement {
        const elClasses = ['overlay-content-inner', 'overlay-create-industry-plan'];
        if (industryPlanService.isIndustryPlanLoadedButNotSaved()) {
            elClasses.push('plan-not-saved');
        }
        const el = createEl('div', null, elClasses);
        // NOT populating this element yet, because it's created in the "super" constructor, before setting the properties of this class
        return el;
    }
}

export {
    OverlayCreateIndustryPlan,
}
