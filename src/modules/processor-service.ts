import * as InfluenceSDK from '@influenceth/sdk';
import {EventEmitter} from './event-emitter.js';

const EVENT_PROCESSOR = {
    PROCESSOR_REMOVED: 'PROCESSOR_REMOVED',
}

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
class ProcessorService extends EventEmitter {
    private static instance: ProcessorService;

    constructor() {
        super();
    }

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
    EVENT_PROCESSOR,
    PROCESSOR_BUILDING_IDS,
    type TYPE_PROCESSOR_BUILDING_IDS,
    processorService,
}
