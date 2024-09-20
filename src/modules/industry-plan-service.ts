import {IndustryPlan} from './industry-plan.js';
import {IndustryTier} from './industry-tier.js';
import {StartupProduct} from './startup-product.js';
import {ProductIcon} from './product-icon.js';

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

    public getAvailableInputsForIndustryTier(industryTier: IndustryTier): (StartupProduct|ProductIcon)[] {
        return this.industryPlan.getStartupProducts(); //// TEST
        //// TO DO: also include outputs from lower industry tiers
    }
}

const industryPlanService: IndustryPlanService = IndustryPlanService.getInstance(); // singleton

export {
    industryPlanService,
}
