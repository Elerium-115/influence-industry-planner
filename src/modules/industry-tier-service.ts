import {EventEmitter} from './event-emitter.js';

const EVENT_INDUSTRY_TIER = {
    INDUSTRY_TIER_POPULATED: 'INDUSTRY_TIER_POPULATED',
    INDUSTRY_TIER_REMOVED: 'INDUSTRY_TIER_REMOVED',
}

/**
 * Singleton
 */
class IndustryTierService extends EventEmitter {
    private static instance: IndustryTierService;

    constructor() {
        super();
    }

    public static getInstance(): IndustryTierService {
        if (!IndustryTierService.instance) {
            IndustryTierService.instance = new IndustryTierService();
        }
        return IndustryTierService.instance;
    }
}

const industryTierService: IndustryTierService = IndustryTierService.getInstance(); // singleton

export {
    EVENT_INDUSTRY_TIER,
    industryTierService,
}
