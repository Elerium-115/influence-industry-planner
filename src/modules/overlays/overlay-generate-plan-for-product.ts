import {createEl} from '../abstract-core.js';
import {OverlayAbstract} from './overlay-abstract';
import {IndustryPlan} from '../industry-plan.js';
import {I_PRODUCT_DATA, productService} from '../product-service.js';

class OverlayGeneratePlanForTargetProducts extends OverlayAbstract {
    private parentIndustryPlan: IndustryPlan;
    private eligibleProducts: I_PRODUCT_DATA[] = [];
    private selectedProducts: I_PRODUCT_DATA[] = [];
    private elInputFilterSearch: HTMLInputElement;
    private elEligibleProductsList: HTMLElement;
    private elSelectedProductsList: HTMLElement;
    private elGeneratePlanButton: HTMLElement;

    constructor(parentIndustryPlan: IndustryPlan) {
        super();

        this.parentIndustryPlan = parentIndustryPlan;
        this.initEligibleProducts();
        this.populateElOverlayContent();
    }

    /**
     * Eligible products = all products excluding:
     * - startup products
     * - raw materials
     */
    private initEligibleProducts(): void {
        const rawMaterialProductIds = productService.getRawMaterialProductIds();
        const startupProductIds = this.parentIndustryPlan.getStartupProducts().map(product => product.getId());
        // All excluded product IDs, potentially containing duplicate IDs (not bothering to de-duplicate them)
        const excludedProductIds = [...rawMaterialProductIds, ...startupProductIds];
        this.eligibleProducts = productService.getAllProductsData()
            .filter(productData => !excludedProductIds.includes(productData.i.toString()))
            .sort(this.compareProductsByName);
    }

    private compareProductsByName(p1: I_PRODUCT_DATA, p2: I_PRODUCT_DATA): number {
        return p1.name.localeCompare(p2.name);
    }

    private onInputFilterSearch(): void {
        this.filterEligibleProducts();
    }

    private filterEligibleProducts(): void {
        const searchQueryLowercase = this.elInputFilterSearch.value.toLowerCase().trim();
        ([...this.elEligibleProductsList.children] as HTMLElement[]).forEach(elProduct => {
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

    private onClickEligibleProduct(eligibleProductClicked: I_PRODUCT_DATA): void {
        // Add it to Selected Products
        this.selectedProducts.push(eligibleProductClicked);
        this.selectedProducts.sort(this.compareProductsByName);
        // Remove it from Eligible Products
        this.eligibleProducts = this.eligibleProducts.filter(eligibleProduct => eligibleProduct !== eligibleProductClicked);
        // Update the lists in the DOM, starting with the Eligible Products
        this.renderEligibleProducts();
        this.renderSelectedProducts();
        // Enable the "Generate Plan" button
        this.elGeneratePlanButton.classList.remove('disabled');
    }

    private onClickSelectedProduct(selectedProductClicked: I_PRODUCT_DATA): void {
        // Add it to Eligible Products
        this.eligibleProducts.push(selectedProductClicked);
        this.eligibleProducts.sort(this.compareProductsByName);
        // Remove it from Selected Products
        this.selectedProducts = this.selectedProducts.filter(selectedProduct => selectedProduct !== selectedProductClicked);
        // Update the lists in the DOM, starting with the Selected Products
        this.renderSelectedProducts();
        this.renderEligibleProducts();
        // Disable the "Generate Plan" button, if no remaining Selected Products
        this.elGeneratePlanButton.classList.toggle('disabled', !this.selectedProducts.length);
    }

    private onClickGeneratePlanButton(): void {
        const selectedProductIds = this.selectedProducts.map(product => product.i.toString());
        this.parentIndustryPlan.onGeneratePlanForTargetProductIds(selectedProductIds);
        this.remove();
    }

    private renderEligibleProducts(): void {
        this.elEligibleProductsList.textContent = '';
        this.eligibleProducts.forEach(eligibleProduct => {
            const el = createEl('div', null, ['product']);
            el.innerHTML += /*html*/ `
                <div class="product-icon -p${eligibleProduct.i}"></div>
                <div class="product-name">${eligibleProduct.name}</div>
            `;
            // Set data for filtering
            el.dataset.productName = eligibleProduct.name;
            el.addEventListener('click', () => this.onClickEligibleProduct(eligibleProduct));
            this.elEligibleProductsList.append(el);
        });
        this.filterEligibleProducts();
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
                <div class="overlay-title">Generate Plan for Target Products</div>
            </div>
            <div class="overlay-info">
                <div>After selecting the target products, the entire industry plan will be generated automatically.</div>
                <div>The minimum number of processor buildings will be used (i.e. multiple processes per building).</div>
                <div>If a product can be made via multiple process variants, the process with the highest throughput will be used.</div>
            </div>
            <div class="overlay-filters">
                <div class="filter-search">
                    <input type="text" name="filter-search" placeholder="🔍  Search">
                </div>
            </div>
            <div class="overlay-lists">
                <div class="overlay-list eligible-products">
                    <div class="overlay-list-title" data-tooltip-position="top-left" data-tooltip="All products, excluding current Startup Products and raw materials">
                        Eligible Products
                    </div>
                    <div class="products-list"></div>
                </div>
                <div class="separator"></div>
                <div class="overlay-list selected-products">
                    <div class="overlay-list-title" data-tooltip-position="top-right" data-tooltip="Select from among the Eligible Products, to add as Target Products">
                        Selected Products
                    </div>
                    <div class="products-list"></div>
                    <div class="cta-button disabled">Generate Plan</div>
                </div>
            </div>
        `;
        this.elInputFilterSearch = this.elOverlayContent.querySelector('input[name="filter-search"]') as HTMLInputElement;
        this.elEligibleProductsList = this.elOverlayContent.querySelector('.eligible-products .products-list') as HTMLElement;
        this.elSelectedProductsList = this.elOverlayContent.querySelector('.selected-products .products-list') as HTMLElement;
        this.elGeneratePlanButton = this.elOverlayContent.querySelector('.cta-button') as HTMLElement;
        this.elInputFilterSearch.addEventListener('input', this.onInputFilterSearch.bind(this));
        this.elGeneratePlanButton.addEventListener('click', this.onClickGeneratePlanButton.bind(this));
        // Explicit focus re: HTML property "autofocus" NOT working as expected, if already triggered in a previous overlay
        this.elInputFilterSearch.focus();
        this.renderEligibleProducts();
    }

    protected makeElOverlayContent(): HTMLElement {
        const el = createEl('div', null, ['overlay-content-inner', 'overlay-generate-plan-for-target-products']);
        // NOT populating this element yet, because it's created in the "super" constructor, before setting the properties of this class
        return el;
    }
}

export {
    OverlayGeneratePlanForTargetProducts,
}
