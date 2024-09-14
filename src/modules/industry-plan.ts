import {IndustryTier} from "./industry-tier.js";

class IndustryPlan {
    private industryTiers: IndustryTier[] = [];

    public getIndustryTiers(): IndustryTier[] {
        return this.industryTiers;
    }
}

export {
    IndustryPlan,
}
