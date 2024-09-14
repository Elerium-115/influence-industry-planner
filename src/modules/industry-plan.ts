import { Processor } from "./processor.js";

export interface IndustryTier {
    processors: Processor[];
}

class IndustryPlan {
    private industryTiers: IndustryTier[] = [];

    public getIndustryTiers(): IndustryTier[] {
        return this.industryTiers;
    }
}

export {
    IndustryPlan,
}
