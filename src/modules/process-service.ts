interface I_PROCESS_DATA {
    i: number,
    name: string,
    processorType: number,
    setupTime: number,
    recipeTime: number,
    inputs: Object, //// TO DO: further detail this as key: string, value: number?
    outputs: Object, //// TO DO: further detail this as key: string, value: number?
    batched?: boolean, // NOT defined for ship integrations and building constructions
};

/**
 * Singleton
 */
class ProcessService {
    private static instance: ProcessService;

    public static getInstance(): ProcessService {
        if (!ProcessService.instance) {
            ProcessService.instance = new ProcessService();
        }
        return ProcessService.instance;
    }
}

const processService: ProcessService = ProcessService.getInstance(); // singleton

export {
    I_PROCESS_DATA,
    processService,
}
