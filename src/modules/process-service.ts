import * as InfluenceSDK from '@influenceth/sdk';

interface I_PROCESS_DATA {
    i: number,
    name: string,
    processorType: number,
    setupTime: number,
    recipeTime: number,
    inputs: {[key in number]: number},
    outputs: {[key in number|string]: number}, // key: string for injected outputs (ships, buildings)
    batched?: boolean, // NOT defined for ship integrations and building constructions
};

/**
 * Singleton
 */
class ProcessService {
    private static instance: ProcessService;

    private allProcessesData: {[key in number]: I_PROCESS_DATA};
    private extractionProcessIdByRawMaterialId: {[key in string]: number} = {};
    private penaltyForSecondaryOutputs: number;

    constructor() {
        this.allProcessesData = {...InfluenceSDK.Process.TYPES};
    }

    public static getInstance(): ProcessService {
        if (!ProcessService.instance) {
            ProcessService.instance = new ProcessService();
        }
        return ProcessService.instance;
    }

    public getAllProcessesData(): {[key in number]: I_PROCESS_DATA} {
        return this.allProcessesData;
    }

    public getProcessDataById(processId: number): I_PROCESS_DATA {
        return this.allProcessesData[processId];
    }

    public setProcessDataById(processData: I_PROCESS_DATA): void {
        this.allProcessesData[processData.i] = processData;
    }

    public getExtractionProcessIdByRawMaterialId(rawMaterialId: string): number {
        return this.extractionProcessIdByRawMaterialId[rawMaterialId];
    }

    public setExtractionProcessIdByRawMaterialId(rawMaterialId: string, extractionProcessId: number): void {
        this.extractionProcessIdByRawMaterialId[rawMaterialId] = extractionProcessId;
    }

    public getPenaltyForSecondaryOutputs(): number {
        return this.penaltyForSecondaryOutputs;
    }

    public setPenaltyForSecondaryOutputs(penalty: number): void {
        this.penaltyForSecondaryOutputs = penalty;
    }

    public sortProcessesByName(processes: (I_PROCESS_DATA)[]): void {
        processes.sort(this.compareProcessesByName);
    }

    private compareProcessesByName(p1: I_PROCESS_DATA, p2: I_PROCESS_DATA): number {
        return p1.name.localeCompare(p2.name);
    }

    public getProcessVariantsForProductId(productId: string): I_PROCESS_DATA[] {
        return Object.values(this.allProcessesData)
            .filter(processData => Object.keys(processData.outputs).includes(productId));
    }

    public getThroughputForProcessOutput(outputProductId: string, processData: I_PROCESS_DATA): number {
        const outputQty = processData.outputs[outputProductId];
        return outputQty / processData.recipeTime;
    }
}

const processService: ProcessService = ProcessService.getInstance(); // singleton

export {
    I_PROCESS_DATA,
    processService,
}
