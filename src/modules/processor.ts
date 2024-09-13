// Source: Influence SDK - "src/lib/processor.js"
enum PROCESSOR_TYPE {
    CONSTRUCTION = 0,
    REFINERY = 1,
    FACTORY = 2,
    BIOREACTOR = 3,
    SHIPYARD = 4,
    DRY_DOCK = 5,
}

class Processor {
    private type: PROCESSOR_TYPE;

    constructor(type: PROCESSOR_TYPE) {
        this.type = type;
    }

    public getType(): PROCESSOR_TYPE {
        return this.type;
    }
}

export {
    PROCESSOR_TYPE,
    Processor,
}
