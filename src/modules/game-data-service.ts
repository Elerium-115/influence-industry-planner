import * as InfluenceSDK from '@influenceth/sdk';
import {
    BuildingData,
    DryDockDataFromLotData,
    ExtractorDataFromLotData,
    LotData,
    ProcessorDataFromLotData,
    RunningProcessData,
} from './types.js';
import {PROCESSOR_BUILDING_IDS, processorService} from './processor-service.js';
import {processService} from './process-service.js';
import {productService} from './product-service.js';

/**
 * Top asteroids by buildings count
 */
const asteroidNameById = {
    1: 'Adalia Prime',
    441: 'APEX DYNAMICS',
    465: 'The Keystone',
    652: 'Urza',
    690: 'Galatia',
    1409: 'Greytower',
    1967: 'Perpetual Forge',
    2250: 'Phyrexia',
    2651: 'Congo',
    8809: 'Lorwyn',
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

    public getAsteroidIdAndLotIndex(lotId: number): {asteroidId: number, lotIndex: number}|null {
        return InfluenceSDK.Lot.toPosition(lotId);
    }

    /**
     * Check if pseudo-empty lot with building planned or under construction
     */
    private isPseudoEmptyLotData(lotData: LotData): boolean {
        return lotData
            && lotData.buildingData
            && !lotData.buildingData.isEmptyLot
            && [1, 2].includes(lotData.buildingData.buildingDetails.status);
    }

    private isEmptyLotData(lotData: LotData, includePseudoEmptyLot: boolean): boolean {
        if (!lotData || !lotData.buildingData) {
            return true;
        }
        if (includePseudoEmptyLot && this.isPseudoEmptyLotData(lotData)) {
            return true;
        }
        return lotData.buildingData.isEmptyLot;
    }

    public getBuildingTypeFromLotData(lotData: LotData): number {
        if (this.isEmptyLotData(lotData, true)) {
            return PROCESSOR_BUILDING_IDS.EMPTY_LOT;
        }
        return (lotData.buildingData as BuildingData).buildingDetails?.buildingType as number;
    }

    public getBuildingNameFromBuildingData(buildingData: BuildingData): string {
        if (buildingData.buildingName) {
            return buildingData.buildingName;
        }
        // Generate default building name
        const buildingTypeText = processorService.getBuildingName(buildingData.buildingDetails.buildingType);
        const buildingIdText = Intl.NumberFormat().format(Number(buildingData.buildingId));
        let buildingNameDefault = `${buildingTypeText} #${buildingIdText}`; // e.g. "Refinery #20,110"
        // Check if building planned or under construction
        const fakeLotData: LotData = {
            lotId: buildingData.lotId,
            buildingData,
        };
        if (this.isPseudoEmptyLotData(fakeLotData)) {
            buildingNameDefault += ' (Site)'; // e.g. "Refinery #20,110 (Site)"
        }
        return buildingNameDefault;
    }

    public getBuildingNameFromLotData(lotData: LotData): string {
        return this.isEmptyLotData(lotData, false) ? 'Empty Lot' : this.getBuildingNameFromBuildingData(lotData.buildingData as BuildingData);
    }

    /**
     * NOTE: This will also return the (construction-) crew name if
     * pseudo-empty lot with building planned or under construction.
     */
    public getBuildingCrewNameFromLotData(lotData: LotData): string {
        return this.isEmptyLotData(lotData, false) ? '' : (lotData.buildingData as BuildingData).crewName;
    }

    public getExtractorsDataFromLotData(lotData: LotData): ExtractorDataFromLotData[] {
        if (this.isEmptyLotData(lotData, true)) {
            return [];
        }

        const extractorsData = (lotData.buildingData as BuildingData).extractors;
        if (!extractorsData || !extractorsData.length) {
            return [];
        }
        return extractorsData;
    }

    public getProcessorsDataFromLotData(lotData: LotData): ProcessorDataFromLotData[] {
        if (this.isEmptyLotData(lotData, true)) {
            return [];
        }
        const processorsData = (lotData.buildingData as BuildingData).processors;
        if (!processorsData || !processorsData.length) {
            return [];
        }
        return processorsData;
    }

    public getDryDocksDataFromLotData(lotData: LotData): DryDockDataFromLotData[] {
        if (this.isEmptyLotData(lotData, true)) {
            return [];
        }
        const dryDocksData = (lotData.buildingData as BuildingData).dryDocks;
        if (!dryDocksData || !dryDocksData.length) {
            return [];
        }
        return dryDocksData;
    }

    public getRunningProcessesDataFromLotData(lotData: LotData): RunningProcessData[] {
        const processesData: RunningProcessData[] = [];
        const extractorsData = this.getExtractorsDataFromLotData(lotData);
        const processorsData = this.getProcessorsDataFromLotData(lotData);
        const dryDocksData = this.getDryDocksDataFromLotData(lotData);
        // Extraction processes
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
        // Processes from refinery / factory / bioreactor / shipyard (excluding ship integrations)
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
        // Ship integration processes from shipyard (excluding module assemblies)
        dryDocksData.forEach(async dryDockData => {
            if (!dryDockData.outputShip) {
                // Not currently running
                return;
            }
            const shipType = dryDockData.outputShip.type;
            // Get process ID matching "shipType"
            const shipProductId = productService.getProductIdByShipType(shipType);
            const processVariants = processService.getProcessVariantsForProductId(shipProductId);
            if (!processVariants.length) {
                return;
            }
            // Assuming single process variant for each ship integration
            const processId = processVariants[0].i;
            if (!processId) {
                return;
            }
            const processData: RunningProcessData = {
                finishTime: dryDockData.finishTime,
                processId,
            };
            processesData.push(processData);
        });
        // Building construction process
        if (this.isPseudoEmptyLotData(lotData)) {
            const buildingData = lotData.buildingData as BuildingData;
            const buildingType = buildingData.buildingDetails.buildingType as number;
            // Get process ID matching "buildingType"
            const buildingProductId = productService.getProductIdByBuildingType(buildingType);
            const processVariants = processService.getProcessVariantsForProductId(buildingProductId);
            if (processVariants.length) {
                // Assuming single process variant for each building construction
                const processId = processVariants[0].i;
                if (processId) {
                    let finishTime = buildingData.buildingDetails.finishTime;
                    if (finishTime === 0 && buildingData.buildingDetails.plannedAt) {
                        //// TO DO: include "totalBonus" arg. = "The crew bonus to apply to the construction time"
                        const constructionTime = InfluenceSDK.Building.getConstructionTime(buildingType);
                        //// TO DO: verify this formula re: not sure about "constructionTime / 8"
                        finishTime = buildingData.buildingDetails.plannedAt + (constructionTime / 8);
                    }
                    const processData: RunningProcessData = {
                        finishTime,
                        processId,
                    };
                    processesData.push(processData);
                }
            }
        }
        return processesData;
    }
}

const gameDataService: GameDataService = GameDataService.getInstance(); // singleton

export {
    gameDataService,
}
