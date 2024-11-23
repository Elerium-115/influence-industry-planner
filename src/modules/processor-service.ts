import * as InfluenceSDK from '@influenceth/sdk';
import {cache} from './cache.js';
import {Processor} from './processor.js';
import {apiService} from './api-service.js';
import {gameDataService} from './game-data-service.js';

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
const PROCESSOR_RGB_BY_BUILDING_NAME = {
    EXTRACTOR: '220, 180, 40',
    BIOREACTOR: '136, 230, 117',
    REFINERY: '87, 213, 255',
    FACTORY: '40, 120, 255',
    SHIPYARD: '129, 129, 255',
    EMPTY_LOT: '241, 131, 97',
};

const PROCESSOR_COLOR_BY_BUILDING_ID = {
    [PROCESSOR_BUILDING_IDS.EXTRACTOR]: `rgb(${PROCESSOR_RGB_BY_BUILDING_NAME.EXTRACTOR})`,
    [PROCESSOR_BUILDING_IDS.BIOREACTOR]: `rgb(${PROCESSOR_RGB_BY_BUILDING_NAME.BIOREACTOR})`,
    [PROCESSOR_BUILDING_IDS.REFINERY]: `rgb(${PROCESSOR_RGB_BY_BUILDING_NAME.REFINERY})`,
    [PROCESSOR_BUILDING_IDS.FACTORY]: `rgb(${PROCESSOR_RGB_BY_BUILDING_NAME.FACTORY})`,
    [PROCESSOR_BUILDING_IDS.SHIPYARD]: `rgb(${PROCESSOR_RGB_BY_BUILDING_NAME.SHIPYARD})`,
    [PROCESSOR_BUILDING_IDS.EMPTY_LOT]: `rgb(${PROCESSOR_RGB_BY_BUILDING_NAME.EMPTY_LOT})`,
};

const PROCESSOR_COLOR_SEMIFADED_BY_BUILDING_ID = {
    [PROCESSOR_BUILDING_IDS.EXTRACTOR]: `rgba(${PROCESSOR_RGB_BY_BUILDING_NAME.EXTRACTOR}, 0.5)`,
    [PROCESSOR_BUILDING_IDS.BIOREACTOR]: `rgba(${PROCESSOR_RGB_BY_BUILDING_NAME.BIOREACTOR}, 0.5)`,
    [PROCESSOR_BUILDING_IDS.REFINERY]: `rgba(${PROCESSOR_RGB_BY_BUILDING_NAME.REFINERY}, 0.5)`,
    [PROCESSOR_BUILDING_IDS.FACTORY]: `rgba(${PROCESSOR_RGB_BY_BUILDING_NAME.FACTORY}, 0.5)`,
    [PROCESSOR_BUILDING_IDS.SHIPYARD]: `rgba(${PROCESSOR_RGB_BY_BUILDING_NAME.SHIPYARD}, 0.5)`,
    [PROCESSOR_BUILDING_IDS.EMPTY_LOT]: `rgba(${PROCESSOR_RGB_BY_BUILDING_NAME.EMPTY_LOT}, 0.5)`,
};

const PROCESSOR_COLOR_FADED_BY_BUILDING_ID = {
    [PROCESSOR_BUILDING_IDS.EXTRACTOR]: `rgba(${PROCESSOR_RGB_BY_BUILDING_NAME.EXTRACTOR}, 0.25)`,
    [PROCESSOR_BUILDING_IDS.BIOREACTOR]: `rgba(${PROCESSOR_RGB_BY_BUILDING_NAME.BIOREACTOR}, 0.25)`,
    [PROCESSOR_BUILDING_IDS.REFINERY]: `rgba(${PROCESSOR_RGB_BY_BUILDING_NAME.REFINERY}, 0.25)`,
    [PROCESSOR_BUILDING_IDS.FACTORY]: `rgba(${PROCESSOR_RGB_BY_BUILDING_NAME.FACTORY}, 0.25)`,
    [PROCESSOR_BUILDING_IDS.SHIPYARD]: `rgba(${PROCESSOR_RGB_BY_BUILDING_NAME.SHIPYARD}, 0.25)`,
    [PROCESSOR_BUILDING_IDS.EMPTY_LOT]: `rgba(${PROCESSOR_RGB_BY_BUILDING_NAME.EMPTY_LOT}, 0.25)`,
};

/**
 * Singleton
 */
class ProcessorService {
    private static instance: ProcessorService;

    /**
     * Queue of processors whose location needs to be updated,
     * potentially via API call for lots without a FRESH cache.
     */
    private processorsLocationUpdateQueue: Processor[] = [];

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

    public queueProcessorLocationUpdate(processor: Processor): void {
        this.processorsLocationUpdateQueue.push(processor);
    }

    public async consumeProcessorsLocationUpdateQueue(): Promise<void> {
        if (!this.processorsLocationUpdateQueue.length) {
            return;
        }
        const chainId = this.processorsLocationUpdateQueue[0].getParentIndustryTier().getParentIndustryPlan().getChainId();
        // Parse only processors with linked in-game lots
        const lotsIds = this.processorsLocationUpdateQueue
            .filter(processor => processor.getAsteroidId() && processor.getLotIndex())
            .map(processor => gameDataService.getLotId(processor.getAsteroidId() as number, processor.getLotIndex() as number) as number);
        // Fetch data from API only for lots without a FRESH cache
        const lotsIdsNotCached = lotsIds.filter(lotId => !cache.isFreshCacheLotsDataByChainAndId(chainId, lotId));
        if (lotsIdsNotCached.length) {
            try {
                const lotDataByIdResponse = await apiService.fetchLotsData(chainId, lotsIdsNotCached);
                if (lotDataByIdResponse.error) {
                    alert(lotDataByIdResponse.error); //// TEST
                } else {
                    // No error => assuming valid "data"
                    const lotDataById = lotDataByIdResponse.data;
                    if (lotDataById) {
                        for (const [lotId, lotData] of Object.entries(lotDataById)) {
                            cache.setCacheLotsDataByChainAndId(chainId, Number(lotId), lotData);
                        }
                    }
                }
            } catch (error: any) {
                console.log(`--- [consumeProcessorsLocationUpdateQueue] ERROR:`, error); //// TEST
            }
        }
        // At this point, the data for all "lotsIds" should be cached
        this.processorsLocationUpdateQueue.forEach(processor => {
            /**
             * Update location for ALL processors, even those without a linked in-game lot,
             * in case their "updateLocation" has NOT been triggered yet - e.g. during "loadIndustryPlanJSON".
             */
            processor.updateLocation();
        });
        this.processorsLocationUpdateQueue = [];
    }
}

const processorService: ProcessorService = ProcessorService.getInstance(); // singleton

export {
    PROCESSOR_BUILDING_IDS,
    type TYPE_PROCESSOR_BUILDING_IDS,
    MOCK_PROCESSOR_ID_EXTRACTOR,
    SDK_PROCESSOR_IDS_BY_BUILDING_ID,
    PROCESSOR_COLOR_BY_BUILDING_ID,
    PROCESSOR_COLOR_SEMIFADED_BY_BUILDING_ID,
    PROCESSOR_COLOR_FADED_BY_BUILDING_ID,
    processorService,
}
