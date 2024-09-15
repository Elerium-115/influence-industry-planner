import * as InfluenceSDK from '@influenceth/sdk';
import {Processor} from './modules/processor.js';
import {
    PROCESSOR_BUILDING_IDS,
    type TYPE_PROCESSOR_BUILDING_IDS,
} from './modules/processor-service.js';
import {IndustryTier} from './modules/industry-tier.js';

// console.log(`--- InfluenceSDK:`, InfluenceSDK); //// TEST

const elTestIndustryTiers = document.getElementById('industry-tiers');

const testIndustryTier = new IndustryTier('Dynamic Processors');
const elTestIndustryTier = testIndustryTier.getHtmlElement();
if (elTestIndustryTiers) {
    elTestIndustryTiers.append(elTestIndustryTier);
}

function testAddBuildingById(processorId: TYPE_PROCESSOR_BUILDING_IDS): void {
    if (!elTestIndustryTiers) {
        return;
    }
    const testProcessor = new Processor(processorId);
    const elTestProcessor = testProcessor.getHtmlElement();
    testIndustryTier.getHtmlElement().append(elTestProcessor);
}

testAddBuildingById(PROCESSOR_BUILDING_IDS.EXTRACTOR);
testAddBuildingById(PROCESSOR_BUILDING_IDS.BIOREACTOR);
testAddBuildingById(PROCESSOR_BUILDING_IDS.REFINERY);
testAddBuildingById(PROCESSOR_BUILDING_IDS.FACTORY);
testAddBuildingById(PROCESSOR_BUILDING_IDS.SHIPYARD);
testAddBuildingById(PROCESSOR_BUILDING_IDS.EMPTY_LOT);

// Expose module logic for the DOM
(globalThis as any).testAddBuildingById = testAddBuildingById;
