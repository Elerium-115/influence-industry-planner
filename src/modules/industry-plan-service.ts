import {IndustryPlan} from './industry-plan.js';
import {IndustryTier} from './industry-tier.js';
import {Processor} from './processor.js';
import {Process} from './process.js';
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
        const products: ProductAbstract[] = [];
        // Add startup products
        this.industryPlan.getStartupProducts().forEach(startupProduct => {
            const startupProductId = startupProduct.getId() as string;
            if (!productService.isInputProductId(startupProductId)) {
                // Product not an input for any process
                return;
            }
            products.push(new ProductAbstract(startupProductId));
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
                        if (products.find(product => product.getId() === outputProductId)) {
                            // Product already added
                            return ;
                        }
                        if (!productService.isInputProductId(outputProductId)) {
                            // Product not an input for any process
                            return;
                        }
                        products.push(new ProductAbstract(outputProduct.getId() as string));
                    });
                });
            });
        });
        productService.sortProductsByName(products);
        return products;
    }

    public getEligibleProcessesForProcessorWithAvailableInputs(processor: Processor, inputs: ProductAbstract): Process[] {
        return []; //// TEST
        //// TO DO: exclude processes already assigned to this processor
    }
}

const industryPlanService: IndustryPlanService = IndustryPlanService.getInstance(); // singleton

export {
    industryPlanService,
}
