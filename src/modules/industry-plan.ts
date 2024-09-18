import {createEl} from './dom-core.js';
import {StartupProduct} from './startup-product.js';
import {EVENT_PRODUCT, productService} from './product-service.js';
import {IndustryTier} from './industry-tier.js';
import {EVENT_INDUSTRY_TIER, industryTierService} from './industry-tier-service.js';

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
        // Listen for events
        productService.addEventListener(
            EVENT_PRODUCT.STARTUP_PRODUCT_REMOVED,
            this.onStartupProductRemoved.bind(this)
        );
        industryTierService.addEventListener(
            EVENT_INDUSTRY_TIER.INDUSTRY_TIER_POPULATED,
            this.onIndustryTierPopulated.bind(this)
        );
        industryTierService.addEventListener(
            EVENT_INDUSTRY_TIER.INDUSTRY_TIER_REMOVED,
            this.onIndustryTierRemoved.bind(this)
        );
    }

    //// TO DO: remove this function after no longer needed for "test.ts"
    public getIndustryTierLast(): IndustryTier {
        return this.industryTiers.slice(-1)[0];
    }

    private getElStartupProdutsList(): HTMLElement {
        // Always "HTMLElement", never "null"
        return this.startupProductsHtmlElement.querySelector('.startup-products-list') as HTMLElement;
    }

    private addStartupProductById(id: string, shouldSortAndUpdate: boolean = true): void {
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

    //// TO DO: remove this function after no longer needed for "test.ts"
    public batchAddStartupProductsByIds(ids: string[]): void {
        ids.forEach(id => this.addStartupProductById(id, false));
        this.onUpdatedStartupProducts();
    }

    private addIndustryTier(): void {
        const industryTierTitle = `Industry Tier #${this.industryTiers.length + 1}`;
        const industryTier = new IndustryTier(industryTierTitle);
        this.industryTiers.push(industryTier);
        // Add new industry tier into the DOM
        this.industryTiersHtmlElement.append(industryTier.getHtmlElement());
    }

    private onStartupProductRemoved(event: Event) {
        const startupProductRemoved = (event as CustomEvent).detail;
        this.startupProducts = this.startupProducts.filter(startupProduct => startupProduct !== startupProductRemoved);
    }

    private onUpdatedStartupProducts(): void {
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

    private onClickAddStartupProductsButton(): void {
        console.log(`--- [onClickAddStartupProductsButton]`); //// TEST
    }

    private onIndustryTierPopulated(event: Event) {
        const industryTierPopulated = (event as CustomEvent).detail;
        if (industryTierPopulated === this.getIndustryTierLast()) {
            // Processor added to last industry tier => add new (empty) industry tier
            this.addIndustryTier();
        }
    }

    private onIndustryTierRemoved(event: Event) {
        const industryTierRemoved = (event as CustomEvent).detail;
        this.industryTiers = this.industryTiers.filter(industryTier => industryTier !== industryTierRemoved);
        // Update the title of all industry tiers
        this.industryTiers.forEach((industryTier: IndustryTier, idx: number) => {
            industryTier.setTitle(`Industry Tier #${idx + 1}`);
        });
    }

    private makeStartupProductsHtmlElement(): HTMLElement {
        const el = createEl('div', 'startup-products');
        el.innerHTML = /*html*/ `
            <div class="startup-products-title"></div>
            <div class="startup-products-list"></div>
            <div class="add-startup-products-button"></div>
        `;
        el.querySelector('.add-startup-products-button')?.addEventListener('click', this.onClickAddStartupProductsButton.bind(this));
        return el;
    }

    private makeIndustryTiersHtmlElement(): HTMLElement {
        const el = createEl('div', 'industry-tiers');
        return el;
    }
}

export {
    IndustryPlan,
}
