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

const MOCK_PROCESSOR_ID_EXTRACTOR = 99; // NO processor for "Extraction" in the SDK, as of Sep 2024

const SDK_PROCESSOR_IDS_BY_BUILDING_ID = {
    [PROCESSOR_BUILDING_IDS.EXTRACTOR]: [MOCK_PROCESSOR_ID_EXTRACTOR], 
    [PROCESSOR_BUILDING_IDS.BIOREACTOR]: [InfluenceSDK.Processor.IDS.BIOREACTOR],
    [PROCESSOR_BUILDING_IDS.REFINERY]: [InfluenceSDK.Processor.IDS.REFINERY],
    [PROCESSOR_BUILDING_IDS.FACTORY]: [InfluenceSDK.Processor.IDS.FACTORY],
    [PROCESSOR_BUILDING_IDS.SHIPYARD]: [InfluenceSDK.Processor.IDS.SHIPYARD, InfluenceSDK.Processor.IDS.DRY_DOCK],
    [PROCESSOR_BUILDING_IDS.EMPTY_LOT]: [InfluenceSDK.Processor.IDS.CONSTRUCTION],
};

// Colors based on styling from "_core.scss"
const PROCESSOR_COLOR_BY_BUILDING_ID = {
    [PROCESSOR_BUILDING_IDS.EXTRACTOR]: 'rgb(220, 180, 40)',
    [PROCESSOR_BUILDING_IDS.BIOREACTOR]: 'rgb(136, 230, 117)',
    [PROCESSOR_BUILDING_IDS.REFINERY]: 'rgb(87, 213, 255)',
    [PROCESSOR_BUILDING_IDS.FACTORY]: 'rgb(40, 120, 255)',
    [PROCESSOR_BUILDING_IDS.SHIPYARD]: 'rgb(129, 129, 255)',
    [PROCESSOR_BUILDING_IDS.EMPTY_LOT]: 'rgb(241, 131, 97)',
};

const PROCESSOR_COLOR_FADED_BY_BUILDING_ID = {
    [PROCESSOR_BUILDING_IDS.EXTRACTOR]: 'rgba(220, 180, 40, 0.5)',
    [PROCESSOR_BUILDING_IDS.BIOREACTOR]: 'rgba(136, 230, 117, 0.5)',
    [PROCESSOR_BUILDING_IDS.REFINERY]: 'rgba(87, 213, 255, 0.5)',
    [PROCESSOR_BUILDING_IDS.FACTORY]: 'rgba(40, 120, 255, 0.5)',
    [PROCESSOR_BUILDING_IDS.SHIPYARD]: 'rgba(129, 129, 255, 0.5)',
    [PROCESSOR_BUILDING_IDS.EMPTY_LOT]: 'rgba(241, 131, 97, 0.5)',
};

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

    public getProcessorBuildingIdBySdkProcessorId(sdkProcesorId: number): TYPE_PROCESSOR_BUILDING_IDS {
        const matchingProcessorBuildingId = Object.values(PROCESSOR_BUILDING_IDS)
            .find(processorBuildingId => SDK_PROCESSOR_IDS_BY_BUILDING_ID[processorBuildingId].includes(sdkProcesorId)) as number;
        return Number(matchingProcessorBuildingId);
    }
}

const processorService: ProcessorService = ProcessorService.getInstance(); // singleton

export {
    PROCESSOR_BUILDING_IDS,
    type TYPE_PROCESSOR_BUILDING_IDS,
    MOCK_PROCESSOR_ID_EXTRACTOR,
    SDK_PROCESSOR_IDS_BY_BUILDING_ID,
    PROCESSOR_COLOR_BY_BUILDING_ID,
    PROCESSOR_COLOR_FADED_BY_BUILDING_ID,
    processorService,
}
