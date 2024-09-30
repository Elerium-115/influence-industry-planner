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

const SDK_RAW_MATERIAL_CATEGORIES_SORTED = [
    InfluenceSDK.Product.CATEGORIES.VOLATILE,
    InfluenceSDK.Product.CATEGORIES.ORGANIC,
    InfluenceSDK.Product.CATEGORIES.METAL,
    InfluenceSDK.Product.CATEGORIES.RARE_EARTH,
    InfluenceSDK.Product.CATEGORIES.FISSILE,
];

/**
 * Singleton
 */
class ProductService {
    private static instance: ProductService;

    private allProductsData: {[key in string]: I_PRODUCT_DATA};
    private rawMaterialsByCategory: {[key in string]: ProductAbstract[]} = {};

    /**
     * Unsorted IDs of products which can be used as inputs for at least one process.
     *
     * NOTE: This is populated via "IndustryPlanService.populateInputProductIds"
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

    public getAllInputProducts(): I_PRODUCT_DATA[] {
        return Object.values(this.allProductsData).filter(productData => this.inputProductIds.includes(productData.i.toString()));
    }

    public getRawMaterialProductIds(): string[] {
        return InfluenceSDK.Product
            .getListByClassification(InfluenceSDK.Product.CLASSIFICATIONS.RAW_MATERIAL)
            .map(numericId => numericId.toString());
    }

    public getRawMaterialsByCategory(category: string): ProductAbstract[] {
        return this.rawMaterialsByCategory[category] || [];
    }

    public getSpectralTypesForRawMaterialId(rawMaterialId: string, onlyPureSpectrals: boolean = false): string[] {
        const spectralTypes: string[] = [];
        Object.values(InfluenceSDK.Asteroid.SPECTRAL_TYPES).forEach(spectralData => {
            const spectralType = spectralData.name.toUpperCase();
            if (onlyPureSpectrals && spectralType.length > 1) {
                // Not a pure spectral type (C / I / M / S)
                return;
            }
            if (spectralData.resources.includes(Number(rawMaterialId))) {
                spectralTypes.push(spectralType);
            }
        });
        return spectralTypes;
    }

    public getSpectralTypesForPureSpectralType(pureSpectralType: string): string[] {
        const spectralTypes: string[] = [];
        Object.values(InfluenceSDK.Asteroid.SPECTRAL_TYPES).forEach(spectralData => {
            const spectralType = spectralData.name.toUpperCase();
            if (spectralType.includes(pureSpectralType)) {
                spectralTypes.push(spectralType);
            }
        });
        return spectralTypes;
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

    public mapRawMaterialsToCategories(): void {
        this.getRawMaterialProductIds().forEach((productId) => {
            const product = new ProductAbstract(productId);
            if (!product.getData().category) {
                return;
            }
            const category = product.getData().category as string;
            if (!this.rawMaterialsByCategory[category]) {
                this.rawMaterialsByCategory[category] = [];
            }
            this.rawMaterialsByCategory[category].push(product);
        });
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
    SDK_RAW_MATERIAL_CATEGORIES_SORTED,
    productService,
}
