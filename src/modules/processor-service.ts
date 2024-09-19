import * as InfluenceSDK from '@influenceth/sdk';

const PROCESSOR_BUILDING_IDS = {
    EXTRACTOR: InfluenceSDK.Building.IDS.EXTRACTOR, // processor: N/A
    BIOREACTOR: InfluenceSDK.Building.IDS.BIOREACTOR, // processor: BIOREACTOR
    REFINERY: InfluenceSDK.Building.IDS.REFINERY, // processor: REFINERY
    FACTORY: InfluenceSDK.Building.IDS.FACTORY, // processor: FACTORY
    SHIPYARD: InfluenceSDK.Building.IDS.SHIPYARD, // processors: SHIPYARD, DRY_DOCK
    EMPTY_LOT: InfluenceSDK.Building.IDS.EMPTY_LOT, // processor: CONSTRUCTION
};

type TYPE_PROCESSOR_BUILDING_IDS = typeof PROCESSOR_BUILDING_IDS[keyof typeof PROCESSOR_BUILDING_IDS];

/**
 * Singleton
 */
class ProcessorService {
    private static instance: ProcessorService;

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
}

const processorService: ProcessorService = ProcessorService.getInstance(); // singleton

export {
    PROCESSOR_BUILDING_IDS,
    type TYPE_PROCESSOR_BUILDING_IDS,
    processorService,
}
