import {ProductAbstract} from './product-abstract.js';

class ProductSelectable extends ProductAbstract {
    private isSelected: boolean;

    constructor(id: string, isSelected: boolean = true) {
        super(id);

        this.isSelected = isSelected;
    }

    public getIsSelected(): boolean {
        return this.isSelected;
    }

    public setIsSelected(isSelected: boolean) {
        this.isSelected = isSelected;
    }
}

export {
    ProductSelectable,
}
