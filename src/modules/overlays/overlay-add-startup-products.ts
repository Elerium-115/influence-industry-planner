import {createEl} from '../dom-core.js';
import {OverlayAbstract} from './overlay-abstract';
import {IndustryPlan} from '../industry-plan.js';
import {I_PRODUCT_DATA, productService} from '../product-service.js';

class OverlayAddStartupProducts extends OverlayAbstract {
    private parentIndustryPlan: IndustryPlan;
    private availableProducts: I_PRODUCT_DATA[] = [];
    private selectedProducts: I_PRODUCT_DATA[] = [];
    private elInputFilterSearch: HTMLInputElement;
    private elAvailableProductsList: HTMLElement;
    private elSelectedProductsList: HTMLElement;
    private elAddProductsButton: HTMLElement;

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

    private onInputFilterSearch(): void {
        this.filterAvailableProducts();
    }

    private filterAvailableProducts(): void {
        const searchQueryLowercase = this.elInputFilterSearch.value.toLowerCase().trim();
        ([...this.elAvailableProductsList.children] as HTMLElement[]).forEach(elProduct => {
            let isVisibleBySearch = false;
            // Filter by search only if search-query NOT empty
            if (searchQueryLowercase) {
                const productName = elProduct.dataset.productName as string;
                isVisibleBySearch = productName.toLowerCase().includes(searchQueryLowercase);
            } else {
                // Not filtering by search
                isVisibleBySearch = true;
            }
            elProduct.classList.toggle('hidden', !isVisibleBySearch);
        });
    }

    private onClickAvailableProduct(availableProductClicked: I_PRODUCT_DATA): void {
        // Add it to Selected Products
        this.selectedProducts.push(availableProductClicked);
        this.selectedProducts.sort(this.compareProductsByName);
        // Remove it from Available Products
        this.availableProducts = this.availableProducts.filter(availableProduct => availableProduct !== availableProductClicked);
        // Update the lists in the DOM, starting with the Available Products
        this.renderAvailableProducts();
        this.renderSelectedProducts();
        // Enable the "Add Products" button
        this.elAddProductsButton.classList.remove('disabled');
    }

    private onClickSelectedProduct(selectedProductClicked: I_PRODUCT_DATA): void {
        // Add it to Available Products
        this.availableProducts.push(selectedProductClicked);
        this.availableProducts.sort(this.compareProductsByName);
        // Remove it from Selected Products
        this.selectedProducts = this.selectedProducts.filter(selectedProduct => selectedProduct !== selectedProductClicked);
        // Update the lists in the DOM, starting with the Selected Products
        this.renderSelectedProducts();
        this.renderAvailableProducts();
        // Disable the "Add Products" button, if no remaining Selected Products
        this.elAddProductsButton.classList.toggle('disabled', !this.selectedProducts.length);
    }

    private onClickAddProductsButton(): void {
        const selectedProductIds = this.selectedProducts.map(product => product.i.toString());
        this.parentIndustryPlan.batchAddStartupProductsByIds(selectedProductIds);
        this.remove();
    }

    private renderAvailableProducts(): void {
        this.elAvailableProductsList.textContent = '';
        this.availableProducts.forEach(availableProduct => {
            const el = createEl('div', null, ['product']);
            el.innerHTML += /*html*/ `
                <div class="product-icon -p${availableProduct.i}"></div>
                <div class="product-name">${availableProduct.name}</div>
            `;
            // Set data for filtering
            el.dataset.productName = availableProduct.name;
            el.addEventListener('click', () => this.onClickAvailableProduct(availableProduct));
            this.elAvailableProductsList.append(el);
        });
        this.filterAvailableProducts();
    }

    private renderSelectedProducts(): void {
        this.elSelectedProductsList.textContent = '';
        this.selectedProducts.forEach(selectedProduct => {
            const el = createEl('div', null, ['product']);
            el.innerHTML += /*html*/ `
                <div class="product-icon -p${selectedProduct.i}"></div>
                <div class="product-name">${selectedProduct.name}</div>
            `;
            el.addEventListener('click', () => this.onClickSelectedProduct(selectedProduct));
            this.elSelectedProductsList.append(el);
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
                    <div class="overlay-list-title" data-tooltip-position="top-left" data-tooltip="All products which can be used as inputs, excluding current Startup Products">
                        Available Products
                    </div>
                    <div class="products-list"></div>
                </div>
                <div class="separator"></div>
                <div class="overlay-list selected-products">
                    <div class="overlay-list-title" data-tooltip-position="top-right" data-tooltip="Select from among the Available Products, to add as Startup Products">
                        Selected Products
                    </div>
                    <div class="products-list"></div>
                    <div class="cta-button disabled">Add Products</div>
                </div>
            </div>
        `;
        this.elInputFilterSearch = this.elOverlayContent.querySelector('input[name="filter-search"]') as HTMLInputElement;
        this.elAvailableProductsList = this.elOverlayContent.querySelector('.available-products .products-list') as HTMLElement;
        this.elSelectedProductsList = this.elOverlayContent.querySelector('.selected-products .products-list') as HTMLElement;
        this.elAddProductsButton = this.elOverlayContent.querySelector('.cta-button') as HTMLElement;
        this.elInputFilterSearch.addEventListener('input', this.onInputFilterSearch.bind(this));
        this.elAddProductsButton.addEventListener('click', this.onClickAddProductsButton.bind(this));
        // Explicit focus re: HTML property "autofocus" NOT working as expected, if already triggered in a previous overlay
        this.elInputFilterSearch.focus();
        this.renderAvailableProducts();
    }

    protected makeElOverlayContent(): HTMLElement {
        const el = createEl('div', null, ['overlay-content-inner', 'overlay-add-startup-products']);
        // NOT populating this element yet, because it's created in the "super" constructor, before setting the properties of this class
        return el;
    }
}

export {
    OverlayAddStartupProducts,
}
