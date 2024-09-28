import {createEl} from './dom-core.js';
import {RefiningPenalty} from './refining-penalty.js';
import {industryPlanService} from './industry-plan-service.js';
import {StartupProduct} from './startup-product.js';
import {IndustryTier} from './industry-tier.js';
import {productService} from './product-service.js';
import {OverlayAddStartupProduct} from './overlays/overlay-add-startup-product.js';

class IndustryPlan {
    private refiningPenalty: RefiningPenalty;
    private startupProducts: StartupProduct[] = [];
    private industryTiers: IndustryTier[] = [];
    private industryPlanHtmlElement: HTMLElement;
    private startupProductsHtmlElement: HTMLElement;
    private industryTiersHtmlElement: HTMLElement;

    constructor() {
        industryPlanService.setIndustryPlan(this);
        // Default penalty for secondary outputs
        this.refiningPenalty = new RefiningPenalty();
        // Always "HTMLElement", never "null"
        this.industryPlanHtmlElement = document.getElementById('industry-plan') as HTMLElement;
        // Empty old industry plan in the DOM
        this.industryPlanHtmlElement.textContent = '';
        /**
         * Add wrappers for main components into the DOM:
         * - refining penalty
         * - startup products (initially empty)
         * - industry tiers (initially empty)
         */
        this.startupProductsHtmlElement = this.makeStartupProductsHtmlElement();
        this.industryTiersHtmlElement = this.makeIndustryTiersHtmlElement();
        this.industryPlanHtmlElement.append(this.refiningPenalty.getHtmlElement());
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

    private getElStartupProdutsList(): HTMLElement {
        // Always "HTMLElement", never "null"
        return this.startupProductsHtmlElement.querySelector('.startup-products-list') as HTMLElement;
    }

    private addStartupProductById(id: string, shouldSortAndUpdate: boolean = true): void {
        if (this.startupProducts.find(startupProduct => startupProduct.getId() === id)) {
            // Startup product already added
            return;
        }
        const startupProduct = new StartupProduct(id, this);
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

    private addIndustryTier(): void {
        const industryTierTitle = `Industry Tier #${this.industryTiers.length + 1}`;
        const industryTier = new IndustryTier(industryTierTitle, this);
        this.industryTiers.push(industryTier);
        // Add new industry tier into the DOM
        this.industryTiersHtmlElement.append(industryTier.getHtmlElement());
    }

    public onStartupProductRemoved(startupProductRemoved: StartupProduct): void {
        this.startupProducts = this.startupProducts.filter(startupProduct => startupProduct !== startupProductRemoved);
        //// TO DO: highlight processes whose inputs are no longer available
        //// -- mark them as "disabled" + exclude their outputs from "getAvailableInputsForIndustryTier"
    }

    private onUpdatedStartupProducts(): void {
        // Sort startup products alphabetically
        productService.sortProductsByName(this.startupProducts);
        // Update startup products in the DOM
        const elStartupProdutsList = this.getElStartupProdutsList();
        // -- Remove old startup products from the DOM
        elStartupProdutsList.textContent = '';
        // -- Add new startup products into the DOM
        this.startupProducts.forEach(startupProduct => {
            elStartupProdutsList.append(startupProduct.getHtmlElement());
        });
    }

    private onClickAddStartupProductsButton(): void {
        new OverlayAddStartupProduct(this);
    }

    public onIndustryTierPopulated(industryTierPopulated: IndustryTier): void {
        if (industryTierPopulated === this.getIndustryTierLast()) {
            // Processor added to last industry tier => add new (empty) industry tier
            this.addIndustryTier();
        }
    }

    public onIndustryTierRemoved(industryTierRemoved: IndustryTier): void {
        this.industryTiers = this.industryTiers.filter(industryTier => industryTier !== industryTierRemoved);
        // Update the title of all remaining industry tiers
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
