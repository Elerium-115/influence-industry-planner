import * as InfluenceSDK from '@influenceth/sdk';

const PROCESSOR_BUILDING_IDS = {
    EMPTY_LOT: InfluenceSDK.Building.IDS.EMPTY_LOT, // processor: CONSTRUCTION
    EXTRACTOR: InfluenceSDK.Building.IDS.EXTRACTOR, // processor: N/A
    REFINERY: InfluenceSDK.Building.IDS.REFINERY, // processor: REFINERY
    BIOREACTOR: InfluenceSDK.Building.IDS.BIOREACTOR, // processor: BIOREACTOR
    FACTORY: InfluenceSDK.Building.IDS.FACTORY, // processor: FACTORY
    SHIPYARD: InfluenceSDK.Building.IDS.SHIPYARD, // processors: SHIPYARD, DRY_DOCK
};

type TYPE_PROCESSOR_BUILDING_IDS = typeof PROCESSOR_BUILDING_IDS[keyof typeof PROCESSOR_BUILDING_IDS];

/**
 * Singleton
 */
class ProcessorService {
    private static instance: ProcessorService;

    private constructor() {}

    public static getInstance(): ProcessorService {
        if (!ProcessorService.instance) {
            ProcessorService.instance = new ProcessorService();
        }
        return ProcessorService.instance;
    }

    /**
     * e.g. "Shipyard" for "buildingId" = 6
     */
    public getBuildingName(buildingId: TYPE_PROCESSOR_BUILDING_IDS): string {
        return InfluenceSDK.Building.TYPES[buildingId].name;
    }

    /**
     * e.g. "Shipbuilding" for "buildingId" = 6 (Shipyard)
     */
    public getBuildingCategoryName(buildingId: TYPE_PROCESSOR_BUILDING_IDS): string {
        return InfluenceSDK.Building.CATEGORY_TYPES[buildingId].name;
    }
}

export {
    PROCESSOR_BUILDING_IDS,
    type TYPE_PROCESSOR_BUILDING_IDS,
    ProcessorService,
}
