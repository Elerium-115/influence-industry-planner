import * as InfluenceSDK from '@influenceth/sdk';
import {IndustryPlan} from './industry-plan.js';
import {IndustryTier} from './industry-tier.js';
import {Processor} from './processor.js';
import {SDK_PROCESSOR_IDS_BY_BUILDING_ID} from './processor-service.js';
import {I_PROCESS_DATA} from './process-service.js';
import {ProductAbstract} from './product-abstract.js';
import {productService} from './product-service.js';

/**
 * Singleton
 */
class IndustryPlanService {
    private static instance: IndustryPlanService;

    private industryPlan: IndustryPlan;

    public static getInstance(): IndustryPlanService {
        if (!IndustryPlanService.instance) {
            IndustryPlanService.instance = new IndustryPlanService();
        }
        return IndustryPlanService.instance;
    }

    public setIndustryPlan(industryPlan: IndustryPlan): void {
        this.industryPlan = industryPlan;
    }

    public getAvailableInputsForIndustryTier(targetIndustryTier: IndustryTier): ProductAbstract[] {
        const availableInputs: ProductAbstract[] = [];
        // Add startup products
        this.industryPlan.getStartupProducts().forEach(startupProduct => {
            const startupProductId = startupProduct.getId() as string;
            if (!productService.isInputProductId(startupProductId)) {
                // Product not an input for any process
                return;
            }
            availableInputs.push(new ProductAbstract(startupProductId));
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
                        const outputProductId = outputProduct.getId() as string;
                        if (availableInputs.find(product => product.getId() === outputProductId)) {
                            // Product already added
                            return ;
                        }
                        if (!productService.isInputProductId(outputProductId)) {
                            // Product not an input for any process
                            return;
                        }
                        availableInputs.push(new ProductAbstract(outputProduct.getId() as string));
                    });
                });
            });
        });
        productService.sortProductsByName(availableInputs);
        return availableInputs;
    }

    public getEligibleProcessesForProcessorUsingInputs(processor: Processor, availableInputs: ProductAbstract[]): I_PROCESS_DATA[] {
        const assignedProcessIds = processor.getProcesses().map(assignedProcess => assignedProcess.getId());
        const availableInputsProductIds = availableInputs.map(availableInput => availableInput.getId());
        // SDK-processors associated with this processor-building
        const sdkProcessorIds = SDK_PROCESSOR_IDS_BY_BUILDING_ID[processor.getId()];
        return Object.values(InfluenceSDK.Process.TYPES)
            // Exclude processes already assigned to this processor-building
            .filter(processData => !assignedProcessIds.includes(processData.i))
            // Keep only processes that can be run by one of the SDK-processors
            .filter(processData => sdkProcessorIds.includes(processData.processorType))
            // Keep only processes that can be run with the available inputs
            .filter(processData => Object.keys(processData.inputs).every(inputProductId => availableInputsProductIds.includes(inputProductId)));
    }
}

const industryPlanService: IndustryPlanService = IndustryPlanService.getInstance(); // singleton

export {
    industryPlanService,
}
