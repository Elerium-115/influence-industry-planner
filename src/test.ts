import {createEl} from './modules/dom-core.js';
import {type TYPE_PROCESSOR_IDS, Processor} from "./modules/processor.js";

const elIndustryTiers = document.getElementById('industry-tiers');
const elIndustryTier = createEl('div', null, ['industry-tier']);
if (elIndustryTiers) {
    elIndustryTiers.append(elIndustryTier);
}

function testAddBuildingById(processorId: TYPE_PROCESSOR_IDS): void {
    if (!elIndustryTiers) {
        return;
    }
    const testProcessor = new Processor(processorId);
    const elTestProcessor = testProcessor.getHtmlElement();
    elIndustryTier.append(elTestProcessor);
}

testAddBuildingById(4);
testAddBuildingById(2);
testAddBuildingById(3);
testAddBuildingById(5);
testAddBuildingById(6);
testAddBuildingById(0);

(globalThis as any).testAddBuildingById = testAddBuildingById;
