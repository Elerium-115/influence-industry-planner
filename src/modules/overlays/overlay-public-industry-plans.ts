import {createEl} from '../dom-core.js';
import {OverlayAbstract} from './overlay-abstract';

class OverlayPublicIndustryPlans extends OverlayAbstract {

    constructor() {
        super();

        this.populateElOverlayContent();
    }

    private populateElOverlayContent(): void {
        this.elOverlayContent.innerHTML = /*html*/ `
            <div class="overlay-header">
                <div class="overlay-title">Public Industry Plans</div>
            </div>
            <div>Under construction...</div>
        `;
    }

    protected makeElOverlayContent(): HTMLElement {
        const el = createEl('div', null, ['overlay-content-inner', 'overlay-public-industry-plans']);
        // NOT populating this element yet, because it's created in the "super" constructor, before setting the properties of this class
        return el;
    }
}

export {
    OverlayPublicIndustryPlans,
}
