import {createEl} from '../dom-core.js';
import {OverlayAbstract} from './overlay-abstract';
import {IndustryPlan} from '../industry-plan.js';
import {I_PRODUCT_DATA, productService} from '../product-service.js';

class OverlayAddStartupProduct extends OverlayAbstract {
    private parentIndustryPlan: IndustryPlan;
    private availableProducts: I_PRODUCT_DATA[];
    private selectedProducts: I_PRODUCT_DATA[];
    private elAvailableProductsList: HTMLElement;
    private elSelectedProductsList: HTMLElement;

    constructor(parentIndustryPlan: IndustryPlan) {
        super();

        this.parentIndustryPlan = parentIndustryPlan;
        this.initAvailableProducts();
        this.populateElOverlayContent();
    }

    private initAvailableProducts(): void {
        const startupProductIds = this.parentIndustryPlan.getStartupProducts().map(product => product.getId());
        this.availableProducts = productService.getAllInputProducts()
            .filter(availableProduct => !startupProductIds.includes(availableProduct.i.toString()))
            .sort(this.compareProductsByName);
    }

    private compareProductsByName(p1: I_PRODUCT_DATA, p2: I_PRODUCT_DATA): number {
        return p1.name.localeCompare(p2.name);
    }

    private onClickAvailableProduct(availableProduct: I_PRODUCT_DATA): void {
        console.log(`--- SELECT availableProduct:`, availableProduct); //// TEST
        //// TO DO: remove it from "availableProducts" => add it into "selectedProducts"
    }

    private populateElAvailableProductsList(): void {
        this.availableProducts.forEach(availableProduct => {
            const el = createEl('div', null, ['available-product']);
            el.innerHTML += /*html*/ `
                <div class="product-icon -p${availableProduct.i}"></div>
                <div class="product-name">${availableProduct.name}</div>
            `;
            el.addEventListener('click', () => this.onClickAvailableProduct(availableProduct));
            this.elAvailableProductsList.append(el);
        });
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
                    <div class="overlay-list-title" data-tooltip="All products which can be used as inputs, excluding current Startup Products">
                        Available Products
                    </div>
                    <div class="available-products-list"></div>
                </div>
                <div class="overlay-list selected-products">
                    <div class="overlay-list-title" data-tooltip="Select from among the Available Products, to add as Startup Products">
                        Selected Products
                    </div>
                    <div class="selected-products-list"></div>
                    <div class="add-products-button disabled">Add Products</div>
                </div>
            </div>
        `;
        this.elAvailableProductsList = this.elOverlayContent.querySelector('.available-products-list') as HTMLElement;
        this.elSelectedProductsList = this.elOverlayContent.querySelector('.selected-products-list') as HTMLElement;
        this.populateElAvailableProductsList();
    }

    protected makeElOverlayContent(): HTMLElement {
        const el = createEl('div', null, ['overlay-content-inner', 'overlay-add-startup-products']);
        // NOT populating this element yet, because it's created in the "super" constructor, before setting the properties of this class
        return el;
    }
}

export {
    OverlayAddStartupProduct,
}
