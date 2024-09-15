import {StartupProduct} from './startup-product.js';
import {IndustryTier} from './industry-tier.js';

class IndustryPlan {
    private startupProducts: StartupProduct[] = [];
    private industryTiers: IndustryTier[] = [];

    public getIndustryTiers(): IndustryTier[] {
        return this.industryTiers;
    }

    public getElStartupProdutsList(): HTMLElement|null {
        return document.getElementById('startup-products-list');
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

    public batchAddStartupProductByIds(ids: string[]): void {
        ids.forEach(id => this.addStartupProductById(id, false));
        this.onUpdatedStartupProducts();
    }

    public onUpdatedStartupProducts(): void {
        // Sort startup products alphabetically
        this.startupProducts.sort(this.compareStartupProductsByName);
        // Update startup products in the DOM
        const elStartupProdutsList = this.getElStartupProdutsList();
        if (!elStartupProdutsList) {
            return;
        }
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
}

export {
    IndustryPlan,
}
