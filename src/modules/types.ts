// label = 4
interface LotData {
    _raw?: any,
    lotId: string,
    buildingData: BuildingData,
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
    extractors: any[],
    processors: any[],
}

interface StandardResponse {
    status: number,
    success: boolean,
    data?: any, // if "success" TRUE
    error?: string, // if "success" FALSE
}

export {
    BuildingData,
    LotData,
    LotDataByIdResponse,
    StandardResponse,
}
