/**
 * Singleton
 */
class IndustryTierService {
    private static instance: IndustryTierService;

    public static getInstance(): IndustryTierService {
        if (!IndustryTierService.instance) {
            IndustryTierService.instance = new IndustryTierService();
        }
        return IndustryTierService.instance;
    }
}

const industryTierService: IndustryTierService = IndustryTierService.getInstance(); // singleton

export {
    industryTierService,
}
