import {createEl} from './dom-core.js';
import {StartupProduct} from './startup-product.js';
import {IndustryTier} from './industry-tier.js';

class IndustryPlan {
    private startupProducts: StartupProduct[] = [];
    private industryTiers: IndustryTier[] = [];
    private industryPlanHtmlElement: HTMLElement;
    private startupProductsHtmlElement: HTMLElement;
    private industryTiersHtmlElement: HTMLElement;

    constructor() {
        // Always "HTMLElement", never "null"
        this.industryPlanHtmlElement = document.getElementById('industry-plan') as HTMLElement;
        // Empty old industry plan in the DOM
        this.industryPlanHtmlElement.textContent = '';
        // Add wrappers for startup products and industry tiers (both initially empty) into the DOM
        this.startupProductsHtmlElement = this.makeStartupProductsHtmlElement();
        this.industryTiersHtmlElement = this.makeIndustryTiersHtmlElement();
        this.industryPlanHtmlElement.append(this.startupProductsHtmlElement);
        this.industryPlanHtmlElement.append(this.industryTiersHtmlElement);
        // Add initial industry tier
        this.addIndustryTier();
    }

    public getStartupProducts(): StartupProduct[] {
        return this.startupProducts;
    }

    public getIndustryTiers(): IndustryTier[] {
        return this.industryTiers;
    }

    public getIndustryTierLast(): IndustryTier {
        return this.industryTiers.slice(-1)[0];
    }

    public getElStartupProdutsList(): HTMLElement {
        // Always "HTMLElement", never "null"
        return this.startupProductsHtmlElement.querySelector('.startup-products-list') as HTMLElement;
    }

    public addStartupProductById(id: string, shouldSortAndUpdate: boolean = true): void {
        if (this.startupProducts.find(startupProduct => startupProduct.getId() === id)) {
            // Startup product already added
            return;
        }
        const startupProduct = new StartupProduct(id);
        if (!startupProduct.getId()) {
            // Invalid startup product / ID
            return;
        }
        this.startupProducts.push(startupProduct);
        if (shouldSortAndUpdate) {
            this.onUpdatedStartupProducts();
        }
    };

    public batchAddStartupProductsByIds(ids: string[]): void {
        ids.forEach(id => this.addStartupProductById(id, false));
        this.onUpdatedStartupProducts();
    }

    public onUpdatedStartupProducts(): void {
        // Sort startup products alphabetically
        this.startupProducts.sort(this.compareStartupProductsByName);
        // Update startup products in the DOM
        const elStartupProdutsList = this.getElStartupProdutsList();
        // -- Remove old startup products from the DOM
        elStartupProdutsList.textContent = '';
        // -- Add new startup products into the DOM
        this.startupProducts.forEach(startupProduct => {
            elStartupProdutsList.append(startupProduct.getHtmlElement());
        });
    }

    private compareStartupProductsByName(p1: StartupProduct, p2: StartupProduct): number {
        return p1.getName().localeCompare(p2.getName());
    }

    public addIndustryTier(): void {
        const newIndustryTierTitle = `Industry Tier #${this.industryTiers.length + 1}`;
        const newIndustryTier = new IndustryTier(newIndustryTierTitle);
        this.industryTiers.push(newIndustryTier);
        // Add new industry tier into the DOM
        this.industryTiersHtmlElement.append(newIndustryTier.getHtmlElement());
    }

    private onClickAddProductsButton(): void {
        console.log(`--- [onClickAddProductsButton]`); //// TEST
    }

    public makeStartupProductsHtmlElement(): HTMLElement {
        const el = createEl('div', 'startup-products');
        el.innerHTML = /*html*/ `
            <div class="startup-products-title"></div>
            <div class="startup-products-list"></div>
            <div class="add-products-button"></div>
        `;
        el.querySelector('.add-products-button')?.addEventListener('click', this.onClickAddProductsButton.bind(this));
        return el;
    }

    public makeIndustryTiersHtmlElement(): HTMLElement {
        const el = createEl('div', 'industry-tiers');
        return el;
    }
}

export {
    IndustryPlan,
}
