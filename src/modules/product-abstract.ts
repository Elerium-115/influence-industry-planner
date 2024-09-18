import {I_PRODUCT_DATA, ProductService} from './product-service.js';

class ProductAbstract {
    private productService: ProductService = ProductService.getInstance(); // singleton

    /**
     * Product ID formats:
     * - '1', '2', '3' etc. for standard products
     * - 'B1', 'B2' etc. for buildings
     * - 'S1', 'S2' etc. for ships
     */
    protected id: string|null = null;
    protected data: I_PRODUCT_DATA;

    constructor(id: string) {
        this.id = id;
        this.data = this.productService.getProductDataById(id);
        if (!this.data) {
            console.error(`--- ERROR: [ProductAbstract] constructor called with invalid id = ${id}`);
            return;
        }
    }

    public getId(): string|null {
        return this.id;
    }

    public getData(): I_PRODUCT_DATA {
        return this.data;
    }

    public getName(): string {
        return this.data.name;
    }
}

export {
    ProductAbstract,
}
