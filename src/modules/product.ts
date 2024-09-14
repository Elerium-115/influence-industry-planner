class Product {
    /**
     * Product ID formats:
     * - '1', '2', '3' etc. for standard products
     * - 'B1', 'B2' etc. for buildings
     * - 'S1', 'S2' etc. for ships
     */
    private id: string|null = null;

    public getId(): string|null {
        return this.id;
    }
}

export {
    Product,
}
