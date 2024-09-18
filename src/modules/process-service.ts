import {EventEmitter} from './event-emitter.js';

const EVENT_PROCESS = {
    PROCESS_REMOVED: 'PROCESS_REMOVED',
}

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
class ProcessService extends EventEmitter {
    private static instance: ProcessService;

    constructor() {
        super();
    }

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
    EVENT_PROCESS,
    processService,
}
