import * as InfluenceSDK from '@influenceth/sdk';
import {uniquePushToArray} from './abstract-core.js';
import {IndustryPlan} from './industry-plan.js';
import {IndustryTier} from './industry-tier.js';
import {Processor} from './processor.js';
import {SDK_PROCESSOR_IDS_BY_BUILDING_ID} from './processor-service.js';
import {I_PROCESS_DATA, processService} from './process-service.js';
import {ProductSelectable} from './product-selectable.js';
import {productService} from './product-service.js';

interface IndustryPlanJSON {
    title: string,
    startupProductIds: string[],
    industryTiers: IndustryTierJSON[],
}

interface IndustryTierJSON {
    processors: ProcessorJSON[],
}

interface ProcessorJSON {
    processes: ProcessJSON[],
};

interface ProcessJSON {
    processId: number,
    primaryOutputId: string,
};

/**
 * Singleton
 */
class IndustryPlanService {
    private static instance: IndustryPlanService;

    private industryPlan: IndustryPlan;

    constructor() {
        /**
         * NOTE: These operations can not be done from "ProductService" or "ProcessService",
         * as that would lead to a circular dependency between those services and/or other classes.
         */
        // Populate empty outputs in the SDK data (for ships and buildings)
        this.updateProcessesWithEmptyOutputs();
        // Generate IDs of products which are used as inputs for at least one process
        this.populateInputProductIds();
        // Add extractions into processes
        this.addExtractionsIntoProcesses();
        // Map raw materials to their category (Volatile etc.)
        productService.mapRawMaterialsToCategories();
    }

    public static getInstance(): IndustryPlanService {
        if (!IndustryPlanService.instance) {
            IndustryPlanService.instance = new IndustryPlanService();
        }
        return IndustryPlanService.instance;
    }

    public setIndustryPlan(industryPlan: IndustryPlan): void {
        this.industryPlan = industryPlan;
    }

    public getIndustryPlanJSON(): IndustryPlanJSON {
        const industryPlanJSON: IndustryPlanJSON = {
            title: this.industryPlan.getTitle(),
            startupProductIds: this.industryPlan.getStartupProducts().map(product => product.getId()),
            industryTiers: [],
        };
        this.industryPlan.getIndustryTiers().forEach(industryTier => {
            const industryTierJSON: IndustryTierJSON = {
                processors: [],
            };
            if (!industryTier.getProcessors().length) {
                return;
            }
            industryTier.getProcessors().forEach(processor => {
                const processorJSON: ProcessorJSON = {
                    processes: [],
                };
                processor.getProcesses().forEach(process => {
                    const processJSON: ProcessJSON = {
                        processId: process.getId() as number,
                        primaryOutputId: process.getPrimaryOutputId(),
                    };
                    processorJSON.processes.push(processJSON);
                });
                industryTierJSON.processors.push(processorJSON);
            });
            industryPlanJSON.industryTiers.push(industryTierJSON);
        });
        return industryPlanJSON;
    }

    public getAvailableInputsForIndustryTier(targetIndustryTier: IndustryTier): ProductSelectable[] {
        const availableInputs: ProductSelectable[] = [];
        // Add startup products
        this.industryPlan.getStartupProducts().forEach(startupProduct => {
            const startupProductId = startupProduct.getId();
            if (!productService.isInputProductId(startupProductId)) {
                // Product not an input for any process
                return;
            }
            availableInputs.push(new ProductSelectable(startupProductId));
        });
        // Add outputs from lower industry tiers
        this.industryPlan.getIndustryTiers().some(industryTier => {
            if (industryTier === targetIndustryTier) {
                // Target industry tier reached => stop parsing industry tiers
                return true;
            }
            // Parse outputs of all processes, from all processors, in this industry tier
            industryTier.getProcessors().forEach(processor => {
                processor.getProcesses().forEach(process => {
                    process.getOutputs().forEach(outputProduct => {
                        const outputProductId = outputProduct.getId();
                        if (availableInputs.find(product => product.getId() === outputProductId)) {
                            // Product already added
                            return ;
                        }
                        if (!productService.isInputProductId(outputProductId)) {
                            // Product not an input for any process
                            return;
                        }
                        availableInputs.push(new ProductSelectable(outputProduct.getId()));
                    });
                });
            });
        });
        productService.sortProductsByName(availableInputs);
        return availableInputs;
    }

    public getEligibleProcessesForProcessorUsingInputs(processor: Processor, availableInputs: ProductSelectable[]): I_PROCESS_DATA[] {
        const assignedProcessIds = processor.getProcesses().map(assignedProcess => assignedProcess.getId());
        const selectedInputsProductIds = availableInputs
            .filter(availableInput => availableInput.getIsSelected())
            .map(availableInput => availableInput.getId());
        // SDK-processors associated with this processor-building
        const sdkProcessorIds = SDK_PROCESSOR_IDS_BY_BUILDING_ID[processor.getId()];
        const eligibleProcesses = Object.values(processService.getAllProcessesData())
            // Exclude processes already assigned to this processor-building
            .filter(processData => !assignedProcessIds.includes(processData.i))
            // Keep only processes that can be run by one of the SDK-processors
            .filter(processData => sdkProcessorIds.includes(processData.processorType))
            // Keep only processes that can be run with the selected inputs
            .filter(processData => Object.keys(processData.inputs).every(inputProductId => selectedInputsProductIds.includes(inputProductId)));
        processService.sortProcessesByName(eligibleProcesses);
        return eligibleProcesses;
    }

    private updateProcessesWithEmptyOutputs(): void {
        Object.values(processService.getAllProcessesData()).forEach(processData => {
            if (Object.keys(processData.outputs).length) {
                return;
            }
            switch (processData.processorType) {
                case InfluenceSDK.Processor.IDS.DRY_DOCK: {
                    // Hardcode output = ship
                    const productData = productService.getProductDataForShipIntegration(processData.name);
                    if (productData) {
                        // Hardcode qty = 1
                        processData.outputs = {[productData.i]: 1};
                    }
                    break;
                }
                case InfluenceSDK.Processor.IDS.CONSTRUCTION: {
                    // Hardcode output = building
                    const productData = productService.getProductDataForBuildingConstruction(processData.name);
                    if (productData) {
                        // Hardcode qty = 1
                        processData.outputs = {[productData.i]: 1};
                    }
                    break;
                }
            }
        });
    }

    private populateInputProductIds(): void {
        const inputProductIds = productService.getInputProductIds();
        Object.values(processService.getAllProcessesData()).forEach(processData => {
            Object.keys(processData.inputs).forEach(inputProductId => {
                uniquePushToArray(inputProductIds, inputProductId);
            });
        });
    }

    private addExtractionsIntoProcesses(): void {
        // Determine min / max ID of standard processes (non-extraction)
        let minProcessId: number|null = null;
        let maxProcessId = 0;
        Object.values(processService.getAllProcessesData()).forEach(processData => {
            minProcessId = minProcessId !== null ? Math.min(minProcessId, processData.i) : processData.i;
            maxProcessId = Math.max(maxProcessId, processData.i);
        });
        /**
         * Add extractions into processes
         * - e.g. raw material "Water" => process "Water Extraction"
         *
         * NOTE:
         * - Ideally, the extraction processes are injected before the standard processes.
         *   This requires the number of extraction processes to be smaller than "minProcessId"
         *   (e.g. if there are 22 extraction processes, "minProcessId" should be at least 23).
         *   In this case, the IDs of extraction processes are incremented starting from 1.
         * - Otherwise, the extraction processes are injected after the standard processes,
         *   and their IDs are incremented starting from "maxProcessId" + 1.
         */
        const rawMaterialProductIds = productService.getRawMaterialProductIds();
        rawMaterialProductIds.forEach((productId, idx) => {
            const productName = productService.getProductNameById(productId.toString());
            const processData: I_PROCESS_DATA = {
                i: 0, // to be updated below
                name: `${productName} Extraction`, // e.g. "Water Extraction"
                processorType: -1, // no processor for "Extraction" in the SDK, as of Sep 2024
                setupTime: 0,
                recipeTime: 0,
                inputs: {},
                outputs: {[productId]: 1}, // output qty = 1
            };
            if (minProcessId !== null && rawMaterialProductIds.length < minProcessId) {
                processData.i = idx + 1;
            } else {
                processData.i = ++maxProcessId;
            }
            processService.setProcessDataById(processData);
            // Also map extraction process IDs to raw material IDs, for convenience
            processService.setExtractionProcessIdByRawMaterialId(productId, processData.i);
        });
    }
}

const industryPlanService: IndustryPlanService = IndustryPlanService.getInstance(); // singleton

export {
    industryPlanService,
}
