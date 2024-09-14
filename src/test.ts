import {type TYPE_PROCESSOR_IDS, Processor} from "./modules/processor.js";
import {IndustryTier} from "./modules/industry-tier.js";

const elTestIndustryTiers = document.getElementById('industry-tiers');

const testIndustryTier = new IndustryTier('Dynamic Processors');
const elTestIndustryTier = testIndustryTier.getHtmlElement();
if (elTestIndustryTiers) {
    elTestIndustryTiers.append(elTestIndustryTier);
}

function testAddBuildingById(processorId: TYPE_PROCESSOR_IDS): void {
    if (!elTestIndustryTiers) {
        return;
    }
    const testProcessor = new Processor(processorId);
    const elTestProcessor = testProcessor.getHtmlElement();
    testIndustryTier.getHtmlElement().append(elTestProcessor);
}

testAddBuildingById(2);
testAddBuildingById(4);
testAddBuildingById(3);
testAddBuildingById(5);
testAddBuildingById(6);
testAddBuildingById(0);

// Expose module logic for the DOM
(globalThis as any).testAddBuildingById = testAddBuildingById;
