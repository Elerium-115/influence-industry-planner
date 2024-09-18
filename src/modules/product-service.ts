import * as InfluenceSDK from '@influenceth/sdk';

interface I_PRODUCT_DATA {
    i: string, // number in the SDK, but string in this app
    name: string,
    classification?: string,
    category?: string,
    massPerUnit?: number,
    volumePerUnit?: number,
    isAtomic?: boolean,
}

/**
 * Singleton
 */
class ProductService {
    private static instance: ProductService;

    private allProductsData: {[key in string]: I_PRODUCT_DATA};

    private constructor() {
        // Add standard products
        this.allProductsData = {...InfluenceSDK.Product.TYPES};
        // Cast "i" (product ID) from number to string
        Object.values(this.allProductsData).forEach(productData => productData.i = productData.i.toString());
        // Add ships
        this.addShipsToAllProducts();
        // Add buildings
        this.addBuildingsToAllProducts();
    }

    public static getInstance(): ProductService {
        if (!ProductService.instance) {
            ProductService.instance = new ProductService();
        }
        return ProductService.instance;
    }

    public getProductDataById(productId: string): I_PRODUCT_DATA {
        return this.allProductsData[productId];
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

    public getProductDataForShipIntegration(integrationProcessName: string): I_PRODUCT_DATA|null {
        return Object.values(this.allProductsData).find(productData => productData.name === integrationProcessName.split('Integration')[0].trim()) || null;
    }

    public getProductDataForBuildingConstruction(constructionProcessName: string): I_PRODUCT_DATA|null {
        return Object.values(this.allProductsData).find(productData => productData.name === constructionProcessName.split('Construction')[0].trim()) || null;
    }
}

export {
    I_PRODUCT_DATA,
    ProductService,
}
