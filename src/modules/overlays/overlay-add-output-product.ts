import {I_PROCESS_DATA} from '../types.js';
import {createEl, getItemNameSafe} from '../abstract-core.js';
import {OverlayAbstract} from './overlay-abstract';
import {industryPlanService} from '../industry-plan-service.js';
import {IndustryTier} from '../industry-tier.js';
import {processorService} from '../processor-service.js';
import {Process} from '../process.js';
import {ProductIcon} from '../product-icon.js';
import {ProductSelectable} from '../product-selectable.js';
import {I_PRODUCT_DATA, productService} from '../product-service.js';

interface I_PRODUCT_DATA_WITH_PROCESS_DATA extends I_PRODUCT_DATA {
    processData: I_PROCESS_DATA,
}

class OverlayAddOutputProduct extends OverlayAbstract {
    private parentIndustryTier: IndustryTier;
    private shouldExcludeRawMaterials: boolean = true;
    private outputProductIdsFromTier: string[] = [];
    private availableInputs: ProductSelectable[] = [];
    private eligibleProcesses: I_PROCESS_DATA[] = [];
    private eligibleOutputs: I_PRODUCT_DATA_WITH_PROCESS_DATA[] = [];
    private elOutputProductsList: HTMLElement;

    constructor(parentIndustryTier: IndustryTier) {
        super();

        this.parentIndustryTier = parentIndustryTier;
        this.outputProductIdsFromTier = parentIndustryTier.getOutputProductIdsFromTier();
        this.availableInputs = industryPlanService.getAvailableInputsForIndustryTier(parentIndustryTier);
        this.eligibleProcesses = industryPlanService.getEligibleProcessesUsingInputs(this.availableInputs);
        this.populateElOverlayContent();
    }

    private updateOutputProducts(): void {
        this.eligibleOutputs = [];
        // Update eligible outputs, using the inputs available for this tier
        const excludedRawMaterialProductIds: string[] = this.shouldExcludeRawMaterials ? productService.getRawMaterialProductIds() : [];
        this.eligibleProcesses.forEach(processData => {
            Object.keys(processData.outputs)
                // Exclude raw materials, depending on "shouldExcludeRawMaterials"
                .filter(outputProductId => !excludedRawMaterialProductIds.includes(outputProductId))
                // Exclude outputs already produced at this industry tier
                .filter(outputProductId => !this.outputProductIdsFromTier.includes(outputProductId))
                // Exclude inputs available for this tier
                .filter(outputProductId => !this.availableInputs.map(input => input.getId()).includes(outputProductId))
                // Exclude outputs already marked as eligible, via the same process variant
                .filter(outputProductId => !this.eligibleOutputs.some(output => {
                    const isSameOutputProductId = output.i === outputProductId;
                    const isSameProcessVariant = output.processData.i === processData.i;
                    return isSameOutputProductId && isSameProcessVariant;
                }))
                .forEach(outputProductId => {
                    const productData = productService.getProductDataById(outputProductId);
                    this.eligibleOutputs.push({
                        ...productData,
                        processData,
                    });
                });
            });
        this.eligibleOutputs.sort(this.compareProductsByName);
        this.renderOutputProducts();
    }

    private compareProductsByName(p1: I_PRODUCT_DATA_WITH_PROCESS_DATA, p2: I_PRODUCT_DATA_WITH_PROCESS_DATA): number {
        // Compare by product name
        let diff = p1.name.localeCompare(p2.name);
        if (diff !== 0) {
            return diff
        }
        // Compare by process name, if multiple process variants for the same product
        return p1.processData.name.localeCompare(p2.processData.name);
    }

    private onChangeExcludeRawMaterials(event: InputEvent): void {
        this.shouldExcludeRawMaterials = (event.target as HTMLInputElement).checked;
        this.updateOutputProducts();
    }

    private onClickOutputProduct(outputProductClicked: I_PRODUCT_DATA_WITH_PROCESS_DATA): void {
        // Add the procesor required for the selected output and its process variant
        const processorBuildingId = processorService.getProcessorBuildingIdBySdkProcessorId(outputProductClicked.processData.processorType);
        const processor = this.parentIndustryTier.addProcessorById(processorBuildingId);
        // Add the process variant into the newly created processor
        const process = processor.addProcessById(outputProductClicked.processData.i) as Process;
        // Set the selected output as the primary output for the newly created process
        const outputProduct = process.getOutputs().find(output => output.getId() === outputProductClicked.i) as ProductIcon;
        process.setPrimaryOutput(outputProduct);
        this.remove();
    }

    private renderOutputProducts(): void {
        this.elOutputProductsList.textContent = '';
        this.eligibleOutputs.forEach(outputProduct => {
            const el = createEl('div', null, ['product']);
            const processorBuildingId = processorService.getProcessorBuildingIdBySdkProcessorId(outputProduct.processData.processorType);
            const buildingName = processorService.getBuildingName(processorBuildingId);
            const processorClassName = `-${getItemNameSafe(buildingName)}`; // e.g. "-empty-lot"
            el.innerHTML += /*html*/ `
                <div class="product-icon -p${outputProduct.i}"></div>
                <div class="product-name">${outputProduct.name}</div>
                <div class="process-name processor ${processorClassName}">${outputProduct.processData.name}</div>
            `;
            const inputNames = Object.keys(outputProduct.processData.inputs)
                .map(inputProductId => productService.getProductNameById(inputProductId));
            el.dataset.tooltipPosition = 'top-right';
            el.dataset.tooltip = `${buildingName}`;
            if (inputNames.length) {
                el.dataset.tooltip += ` - Inputs: ${inputNames.join(', ')}`;
            }
            el.addEventListener('click', () => this.onClickOutputProduct(outputProduct));
            this.elOutputProductsList.append(el);
        });
    }

    private populateElOverlayContent(): void {
        this.elOverlayContent.innerHTML = /*html*/ `
            <div class="overlay-header">
                <div class="overlay-title">Add Output Product</div>
                <div class="industry-tier">${this.parentIndustryTier.getTitle()}</div>
            </div>
            <div class="overlay-info">
                <div>These products can be made using only the startup products, and the outputs from lower industry tiers.</div>
                <div>Selecting one of them will automatically add the process which outputs it, into the current industry tier.</div>
                <div>This list excludes: outputs already produced at - or available for - the current industry tier.</div>
            </div>
            <div class="overlay-filters">
                <div class="filter-checkboxes">
                    <label><input type="checkbox" name="exclude-raw-materials" checked>Exclude Raw Materials</label>
                </div>
            </div>
            <div class="overlay-lists">
                <div class="overlay-list">
                    <div class="overlay-list-title">Eligible Outputs</div>
                    <div class="products-list"></div>
                </div>
            </div>
        `;
        this.elOverlayContent.querySelector('input[name="exclude-raw-materials"]')?.addEventListener('change', this.onChangeExcludeRawMaterials.bind(this));
        this.elOutputProductsList = this.elOverlayContent.querySelector('.products-list') as HTMLElement;
        this.updateOutputProducts();
    }

    protected makeElOverlayContent(): HTMLElement {
        const el = createEl('div', null, ['overlay-content-inner', 'overlay-add-output-product']);
        // NOT populating this element yet, because it's created in the "super" constructor, before setting the properties of this class
        return el;
    }
}

export {
    OverlayAddOutputProduct,
}
