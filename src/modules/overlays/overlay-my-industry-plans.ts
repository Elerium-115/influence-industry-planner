import {createEl} from '../abstract-core.js';
import {OverlayAbstract} from './overlay-abstract';
import {IndustryPlanJSON, industryPlanService} from '../industry-plan-service.js';

class OverlayMyIndustryPlans extends OverlayAbstract {
    private elOverlayList: HTMLElement;

    constructor() {
        super();

        this.populateElOverlayContent();
    }

    private onClickListItem(industryPlanJSON: IndustryPlanJSON): void {
        industryPlanService.loadIndustryPlanJSON(industryPlanJSON);
        this.remove();
    }

    private renderIndustryPlansList(sortBy: 'title'|'updatedTs' = 'title'): void {
        this.elOverlayList.textContent = '';
        // Add header-row
        const elHeader = createEl('div', null, ['list-item', 'list-item-header']);
        elHeader.innerHTML = /*html*/ `
            <div>Plan Title</div>
            <div>Last Updated</div>
        `;
        // Add actual rows
        this.elOverlayList.append(elHeader);
        industryPlanService.getSavedIndustryPlansJSON().forEach(industryPlanJSON => {
            const el = createEl('div', null, ['list-item']);
            let updatedText = '';
            if (industryPlanJSON.updatedTs) {
                // Format date based on the user's locale and timezone
                updatedText = Intl.DateTimeFormat(undefined, {
                    dateStyle: 'long',
                    timeStyle: 'long',
                }).format(industryPlanJSON.updatedTs);
            }
            el.innerHTML = /*html*/ `
                <div>${industryPlanJSON.title}</div>
                <div>${updatedText}</div>
            `;
            //// TO DO: also show "final products" for each plan = end-tier outputs
            el.addEventListener('click', () => this.onClickListItem(industryPlanJSON));
            this.elOverlayList.append(el);
        });
    }

    private populateElOverlayContent(): void {
        this.elOverlayContent.innerHTML = /*html*/ `
            <div class="overlay-header">
                <div class="overlay-title">My Industry Plans</div>
            </div>
            <div class="overlay-list"></div>
        `;
        this.elOverlayList = this.elOverlayContent.querySelector('.overlay-list') as HTMLElement;
        this.renderIndustryPlansList();
    }

    protected makeElOverlayContent(): HTMLElement {
        const elClasses = ['overlay-content-inner', 'overlay-my-industry-plans'];
        if (industryPlanService.isIndustryPlanLoadedButNotSaved()) {
            elClasses.push('plan-not-saved');
        }
        const el = createEl('div', null, elClasses);
        // NOT populating this element yet, because it's created in the "super" constructor, before setting the properties of this class
        return el;
    }
}

export {
    OverlayMyIndustryPlans,
}
