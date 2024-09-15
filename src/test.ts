import * as InfluenceSDK from '@influenceth/sdk';
import {Processor} from './modules/processor.js';
import {
    PROCESSOR_BUILDING_IDS,
    type TYPE_PROCESSOR_BUILDING_IDS,
} from './modules/processor-service.js';
import {IndustryPlan} from './modules/industry-plan.js';
import {IndustryTier} from './modules/industry-tier.js';

global.InfluenceSDK = InfluenceSDK; //// TEST
// console.log(`--- InfluenceSDK:`, InfluenceSDK); //// TEST

const industryPlan = new IndustryPlan();

const testStartupProductIds = ['1', '3', '15', '23', '44', '48', '52', '55', '69', '70',  '81'];
industryPlan.batchAddStartupProductByIds(testStartupProductIds);
console.log(`--- industryPlan:`, industryPlan); //// TEST

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
