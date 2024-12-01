type ChainId = 'SN_MAIN'|'SN_SEPOLIA';

// label = 4
interface LotData {
    _raw?: any,
    lotId: string,
    buildingData: BuildingData|null, // null for Empty Lot
    _timestamp?: number,
}

interface LotDataByIdResponse extends StandardResponse {
    data?: {[key: string]: LotData},
}

// label = 5
interface BuildingData {
    _raw?: any,
    buildingId: string,
    buildingDetails: any,
    buildingName: string|null,
    crewName: string|null,
    lotId: string,
    dryDocks: any[],
    extractors: ExtractorDataFromLotData[],
    processors: ProcessorDataFromLotData[],
}

interface StandardResponse {
    status: number,
    success: boolean,
    data?: any, // if "success" TRUE
    error?: string, // if "success" FALSE
}

/**
 * Relevant extractor data from each item in "lotData.buildingData.exctractors"
 */
interface ExtractorDataFromLotData {
    finishTime: number,
    outputProduct: number,
}

/**
 * Relevant processor data from each item in "lotData.buildingData.processors"
 */
interface ProcessorDataFromLotData {
    finishTime: number,
    runningProcess: number,
}

interface RunningProcessData {
    finishTime: number,
    processId: number,
}

/**
 * SDK process data
 */
interface I_PROCESS_DATA {
    i: number,
    name: string,
    processorType: number,
    setupTime: number,
    recipeTime: number,
    inputs: {[key: number]: number},
    outputs: {[key: number|string]: number}, // key: string for injected outputs (ships, buildings)
    batched?: boolean, // NOT defined for ship integrations and building constructions
};

export {
    ChainId,
    BuildingData,
    ExtractorDataFromLotData,
    I_PROCESS_DATA,
    LotData,
    LotDataByIdResponse,
    RunningProcessData,
    ProcessorDataFromLotData,
    StandardResponse,
}
