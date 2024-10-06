import {createEl} from '../dom-core.js';
import {OverlayAbstract} from './overlay-abstract';
import {IndustryTier} from '../industry-tier.js';
import {I_PRODUCT_DATA} from '../product-service.js';

class OverlayAddOutputProduct extends OverlayAbstract {
    private parentIndustryTier: IndustryTier;
    private outputProducts: I_PRODUCT_DATA[] = [];
    private elOutputProductsList: HTMLElement;

    constructor(parentIndustryTier: IndustryTier) {
        super();

        this.parentIndustryTier = parentIndustryTier;
        this.initOutputProducts();
        this.populateElOverlayContent();
    }

    private initOutputProducts(): void {
        this.outputProducts = []; //// TEST
        //// TO DO: init eligible outputs, using the products available for this tier
        //// TO DO: exclude outputs already produced at the current industry tier
    }

    private compareProductsByName(p1: I_PRODUCT_DATA, p2: I_PRODUCT_DATA): number {
        return p1.name.localeCompare(p2.name);
    }

    private onClickOutputProduct(outputProductClicked: I_PRODUCT_DATA): void {
        //// TO DO: add processor + process for the selected output, into this tier
        this.remove();
    }

    private renderOutputProducts(): void {
        this.elOutputProductsList.textContent = '';
        this.outputProducts.forEach(outputProduct => {
            const el = createEl('div', null, ['product']);
            el.innerHTML += /*html*/ `
                <div class="product-icon -p${outputProduct.i}"></div>
                <div class="product-name">${outputProduct.name}</div>
            `;
            //// TO DO: group process variants under each eligible output
            el.addEventListener('click', () => this.onClickOutputProduct(outputProduct));
            this.elOutputProductsList.append(el);
        });
    }

    private populateElOverlayContent(): void {
        this.elOverlayContent.innerHTML = /*html*/ `
            <div class="overlay-header">
                <div class="overlay-title">Add Output Product</div>
                <div class="industry-tier">${this.parentIndustryTier.getTitle()}</div>
            </div>
            <div class="overlay-info">
                <div>These products can be made using only the startup products, and the outputs from lower industry tiers.</div>
                <div>Selecting one of them will automatically add the process which outputs it, into the current industry tier.</div>
                <div>The outputs already produced at the current industry tier are excluded from this list.</div>
            </div>
            <div class="overlay-lists">
                <div class="overlay-list output-products">
                    <div class="overlay-list-title">Eligible Outputs</div>
                    <div class="products-list"></div>
                </div>
            </div>
        `;
        this.elOutputProductsList = this.elOverlayContent.querySelector('.output-products .products-list') as HTMLElement;
        this.renderOutputProducts();
    }

    protected makeElOverlayContent(): HTMLElement {
        const el = createEl('div', null, ['overlay-content-inner', 'overlay-add-output-product']);
        // NOT populating this element yet, because it's created in the "super" constructor, before setting the properties of this class
        return el;
    }
}

export {
    OverlayAddOutputProduct,
}
