import {getItemNameSafe} from '../abstract-core.js';
import {createEl} from '../dom-core.js';
import {OverlayAbstract} from './overlay-abstract';
import {Processor} from '../processor.js';
import {processService} from '../process-service.js';
import {productService, SDK_RAW_MATERIAL_CATEGORIES_SORTED} from '../product-service.js';

class OverlayAddExtraction extends OverlayAbstract {
    private parentProcessor: Processor;
    private elRawMaterialsList: HTMLElement;

    constructor(parentProcessor: Processor) {
        super();

        this.parentProcessor = parentProcessor;
        this.populateElOverlayContent();
    }

    private onClickRawMaterialById(rawMaterialId: string): void {
        const processId = processService.getExtractionProcessIdByRawMaterialId(rawMaterialId);
        this.parentProcessor.addProcessById(processId);
        this.remove();
    }

    private populateElRawMaterialsList(): void {
        SDK_RAW_MATERIAL_CATEGORIES_SORTED.forEach(category => {
            const rawMaterials = productService.getRawMaterialsByCategory(category);
            productService.sortProductsByName(rawMaterials);
            const elCategory = createEl('div', null, ['category', `-${getItemNameSafe(category)}`]);
            elCategory.dataset.name = category;
            const elCategoryList = createEl('div', null, ['category-list']);
            rawMaterials.forEach(rawMaterial => {
                const rawMaterialId = rawMaterial.getId();
                const extractionProcessId = processService.getExtractionProcessIdByRawMaterialId(rawMaterialId);
                if (this.parentProcessor.getProcesses().map(process => process.getId()).includes(extractionProcessId)) {
                    // Do not show raw materials already being extracted by this processor
                    return;
                }
                elCategoryList.append(this.makeElRawMaterial(rawMaterialId));
            })
            elCategory.append(elCategoryList);
            this.elRawMaterialsList.append(elCategory);
        });
    }

    private makeElRawMaterial(productId: string): HTMLElement {
        const el = createEl('div', null, ['raw-material']);
        const elIcon = createEl('div', null, ['product-icon', `-p${productId}`]);
        el.append(elIcon);
        const elName = createEl('div', null, ['product-name']);
        elName.textContent = productService.getProductNameById(productId);
        el.append(elName);
        const pureSpectralTypes = productService.getSpectralTypesForRawMaterialId(productId, true);
        const elSpectralTypes = createEl('div', null, ['spectral-types']);
        pureSpectralTypes.forEach(spectralType => {
            const elSpectralType = createEl('div', null, ['spectral-type']);
            elSpectralType.textContent = spectralType
            elSpectralTypes.append(elSpectralType);
        });
        el.append(elSpectralTypes);
        el.addEventListener('click', () => this.onClickRawMaterialById(productId));
        return el;
    }

    private populateElOverlayContent(): void {
        const processorClassName = this.parentProcessor.getProcessorClassName();
        this.elOverlayContent.innerHTML = /*html*/ `
            <div class="overlay-header">
                <div class="overlay-title">Add Extraction</div>
                <div class="processor ${processorClassName}">
                    <div class="processor-header">
                        <div class="processor-name">${this.parentProcessor.getName()}</div>
                    </div>
                </div>
            </div>
            <div class="raw-materials-list"></div>
        `;
        this.elRawMaterialsList = this.elOverlayContent.querySelector('.raw-materials-list') as HTMLElement;
        this.populateElRawMaterialsList();
    }

    protected makeElOverlayContent(): HTMLElement {
        const el = createEl('div', null, ['overlay-add-extraction']);
        // NOT populating this element yet, because it's created in the "super" constructor, before setting the properties of this class
        return el;
    }
}

export {
    OverlayAddExtraction,
}
