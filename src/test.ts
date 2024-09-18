// import * as InfluenceSDK from '@influenceth/sdk'; //// TEST
import {PROCESSOR_BUILDING_IDS, type TYPE_PROCESSOR_BUILDING_IDS} from './modules/processor-service.js';
import {IndustryPlan} from './modules/industry-plan.js';

// global.InfluenceSDK = InfluenceSDK; //// TEST
// console.log(`--- InfluenceSDK:`, InfluenceSDK); //// TEST

const testIndustryPlan = new IndustryPlan();

// Test add startup products
const testStartupProductIds = ['1', '3', '15', '23', '44', '48', '52', '55', '69', '70',  '81'];
testIndustryPlan.batchAddStartupProductsByIds(testStartupProductIds);
console.log(`--- testIndustryPlan:`, testIndustryPlan); //// TEST

// Test add processors + processes into the last industry tier
const testProcessorsAndProcesses = [
    {id: PROCESSOR_BUILDING_IDS.EXTRACTOR, processIds: []},
    {id: PROCESSOR_BUILDING_IDS.BIOREACTOR, processIds: []},
    {id: PROCESSOR_BUILDING_IDS.REFINERY, processIds: [24, 91, 82]},
    {id: PROCESSOR_BUILDING_IDS.FACTORY, processIds: [57]},
    {id: PROCESSOR_BUILDING_IDS.SHIPYARD, processIds: [252, 222]},
    {id: PROCESSOR_BUILDING_IDS.EMPTY_LOT, processIds: [300]},
];
testProcessorsAndProcesses.forEach(processorData => {
    const processor = testIndustryPlan.getIndustryTierLast().addProcessorById(processorData.id);
    processorData.processIds.forEach(processId => {
        processor.addProcessById(processId);
    });
});

function testAddProcessorById(processorId: TYPE_PROCESSOR_BUILDING_IDS): void {
    testIndustryPlan.getIndustryTierLast().addProcessorById(processorId);
}

// Expose module logic for the DOM (only required while testing for "#test-add-building")
(globalThis as any).testAddProcessorById = testAddProcessorById;
