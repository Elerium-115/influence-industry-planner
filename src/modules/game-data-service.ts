import * as InfluenceSDK from '@influenceth/sdk';
import {LotData} from './types';

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
}

const gameDataService: GameDataService = GameDataService.getInstance(); // singleton

export {
    gameDataService,
}
