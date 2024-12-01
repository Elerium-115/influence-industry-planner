import * as InfluenceSDK from '@influenceth/sdk';
import {
    ExtractorDataFromLotData,
    LotData,
    ProcessorDataFromLotData,
    RunningProcessData,
} from './types.js';
import {processService} from './process-service.js';

const asteroidNameById = {
    1: 'Adalia Prime',
};

/**
 * Singleton
 */
class GameDataService {
    private static instance: GameDataService;

    public static getInstance(): GameDataService {
        if (!GameDataService.instance) {
            GameDataService.instance = new GameDataService();
        }
        return GameDataService.instance;
    }

    public getAsteroidName(asteroidId: number|null): string {
        if (!asteroidId) {
            return 'N/A';
        }
        const asteroidName = asteroidNameById[asteroidId];
        return asteroidName ? asteroidName : `Asteroid #${asteroidId}`;
    }

    public getLotId(asteroidId: number, lotIndex: number): number|null {
        return InfluenceSDK.Lot.toId(asteroidId, lotIndex);
    }

    public getBuildingTypeFromLotData(lotData: LotData): number|null {
        if (!lotData) {
            return null;
        }
        return lotData.buildingData?.buildingDetails?.buildingType as number;
    }

    public getBuildingNameFromLotData(lotData: LotData): string|null {
        if (!lotData) {
            return null;
        }
        return lotData.buildingData?.buildingName as string;
    }

    public getBuildingCrewNameFromLotData(lotData: LotData): string|null {
        if (!lotData) {
            return null;
        }
        return lotData.buildingData?.crewName as string;
    }

    public getExtractorsDataFromLotData(lotData: LotData): ExtractorDataFromLotData[] {
        if (!lotData) {
            return [];
        }
        const extractorsData = lotData.buildingData?.extractors;
        if (!extractorsData || !extractorsData.length) {
            return [];
        }
        return extractorsData;
    }

    public getProcessorsDataFromLotData(lotData: LotData): ProcessorDataFromLotData[] {
        if (!lotData) {
            return [];
        }
        const processorsData = lotData.buildingData?.processors;
        if (!processorsData || !processorsData.length) {
            return [];
        }
        return processorsData;
    }

    public getRunningProcessesDataFromLotData(lotData: LotData): RunningProcessData[] {
        const processesData: RunningProcessData[] = [];
        const extractorsData = this.getExtractorsDataFromLotData(lotData);
        const processorsData = this.getProcessorsDataFromLotData(lotData);
        extractorsData.forEach(extractorData => {
            if (!extractorData.outputProduct) {
                // Not currently running
                return;
            }
            const processData: RunningProcessData = {
                finishTime: extractorData.finishTime,
                processId: processService.getExtractionProcessIdByRawMaterialId(extractorData.outputProduct.toString()),
            };
            processesData.push(processData);
        });
        processorsData.forEach(processorData => {
            if (!processorData.runningProcess) {
                // Not currently running
                return;
            }
            const processData: RunningProcessData = {
                finishTime: processorData.finishTime,
                processId: processorData.runningProcess,
            };
            processesData.push(processData);
        });
        return processesData;
    }
}

const gameDataService: GameDataService = GameDataService.getInstance(); // singleton

export {
    gameDataService,
}
