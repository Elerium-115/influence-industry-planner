import {createEl} from '../dom-core.js';
import {OverlayAbstract} from './overlay-abstract';
import {IndustryPlan} from '../industry-plan.js';

class OverlayAddStartupProduct extends OverlayAbstract {
    private parentIndustryPlan: IndustryPlan;
    private elAvailableProductsList: HTMLElement;
    private elSelectedProductsList: HTMLElement;

    constructor(parentIndustryPlan: IndustryPlan) {
        super();

        this.parentIndustryPlan = parentIndustryPlan;
        this.populateElOverlayContent();
    }

    private populateElOverlayContent(): void {
        this.elOverlayContent.innerHTML = /*html*/ `
            <div class="overlay-header">
                <div class="overlay-title">Add Startup Products</div>
            </div>
            <div class="overlay-filters">
                <div class="filter-search">
                    <input type="text" name="filter-search" placeholder="🔍  Search">
                </div>
            </div>
            <div class="overlay-lists">
                <div class="overlay-list available-products">
                    <div class="overlay-list-title">Available Products</div>
                    <div class="available-products-list"></div>
                </div>
                <div class="overlay-list selected-products">
                    <div class="overlay-list-title">Selected Products</div>
                    <div class="selected-products-list"></div>
                    <div class="add-products-button disabled">Add Products</div>
                </div>
            </div>
        `;
        this.elAvailableProductsList = this.elOverlayContent.querySelector('.available-products-list') as HTMLElement;
        this.elSelectedProductsList = this.elOverlayContent.querySelector('.selected-products-list') as HTMLElement;
        //// TO DO: populate "elAvailableProductsList" w/ products NOT currently added as startup products @ "parentIndustryPlan"
    }

    protected makeElOverlayContent(): HTMLElement {
        const el = createEl('div', null, ['overlay-add-startup-products']);
        // NOT populating this element yet, because it's created in the "super" constructor, before setting the properties of this class
        return el;
    }
}

export {
    OverlayAddStartupProduct,
}
