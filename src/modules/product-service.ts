import * as InfluenceSDK from '@influenceth/sdk';
import {getProductImageSrc} from './abstract-core.js';
import {createEl} from './dom-core.js';
import {StartupProduct} from './startup-product.js';
import {ProductIcon} from './product-icon.js';
import {ProductAbstract} from './product-abstract.js';

interface I_PRODUCT_DATA {
    i: number|string, // number in the SDK, but string in this app
    name: string,
    classification?: string,
    category?: string,
    massPerUnit?: number,
    volumePerUnit?: number,
    isAtomic?: boolean,
}

type ProductAny = StartupProduct|ProductIcon|ProductAbstract;

/**
 * Singleton
 */
class ProductService {
    private static instance: ProductService;

    private allProductsData: {[key in string]: I_PRODUCT_DATA};

    /**
     * Unsorted IDs of products which are used as inputs for at least one process
     */
    private inputProductIds: string[] = [];

    constructor() {
        // Add standard products
        this.allProductsData = {...InfluenceSDK.Product.TYPES};
        // Cast "i" (product ID) from number to string
        Object.values(this.allProductsData).forEach(productData => productData.i = productData.i.toString());
        // Add ships
        this.addShipsToAllProducts();
        // Add buildings
        this.addBuildingsToAllProducts();
        // Inject style with background-images for all product icons
        this.injectStyleForProductIcons();
    }

    public static getInstance(): ProductService {
        if (!ProductService.instance) {
            ProductService.instance = new ProductService();
        }
        return ProductService.instance;
    }

    public getInputProductIds(): string[] {
        return this.inputProductIds;
    }

    public isInputProductId(productId: string): boolean {
        return this.inputProductIds.includes(productId);
    }

    public getProductDataById(productId: string): I_PRODUCT_DATA {
        return this.allProductsData[productId];
    }

    public getProductNameById(productId: string): string {
        return this.allProductsData[productId].name;
    }

    public getProductDataForShipIntegration(integrationProcessName: string): I_PRODUCT_DATA|null {
        return Object.values(this.allProductsData).find(productData => productData.name === integrationProcessName.split('Integration')[0].trim()) || null;
    }

    public getProductDataForBuildingConstruction(constructionProcessName: string): I_PRODUCT_DATA|null {
        return Object.values(this.allProductsData).find(productData => productData.name === constructionProcessName.split('Construction')[0].trim()) || null;
    }

    private addShipsToAllProducts(): void {
        let nextShipIdx = 1;
        Object.values(InfluenceSDK.Ship.TYPES)
            // Skip "Escape Module" because it already exists as a product
            .filter((shipData: any) => shipData.i !== InfluenceSDK.Ship.IDS.ESCAPE_MODULE)
            .forEach((shipData: any) => {
                const shipId = `S${nextShipIdx++}`;
                const productData: I_PRODUCT_DATA = {
                    i: shipId,
                    name: shipData.name,
                };
                this.allProductsData[shipId] = productData;
            });
    }

    private addBuildingsToAllProducts(): void {
        let nextBuildingIdx = 1;
        Object.values(InfluenceSDK.Building.TYPES)
            // Skip "Empty Lot" because it is not a product
            .filter((buildingData: any) => buildingData.i !== InfluenceSDK.Building.IDS.EMPTY_LOT)
            .forEach((buildingData: any) => {
                const buildingId = `B${nextBuildingIdx++}`;
                const productData: I_PRODUCT_DATA = {
                    i: buildingId,
                    name: buildingData.name,
                };
                this.allProductsData[buildingId] = productData;
            });
    }

    /**
     * Inject "<style>" tag into the DOM, with product icon URLs for ".product-icon"
     */
    private injectStyleForProductIcons(): void {
        let productIconImages: string = '';
        Object.values(this.allProductsData).forEach(productData => {
            productIconImages += `&.-p${productData.i} { background-image: url('${getProductImageSrc(productData.name, 'thumb')}'); }\n`;
        });
        const elStyle = createEl('style');
        elStyle.innerHTML = /*html*/ `
            .product-icon {
                ${productIconImages}
            }
        `;
        document.head.append(elStyle);
    }

    public sortProductsByName(products: (ProductAny)[]): void {
        products.sort(this.compareProductsByName);
    }

    private compareProductsByName(p1: ProductAny, p2: ProductAny): number {
        return p1.getName().localeCompare(p2.getName());
    }
}

const productService: ProductService = ProductService.getInstance(); // singleton

export {
    I_PRODUCT_DATA,
    productService,
}
