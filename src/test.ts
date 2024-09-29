import {PROCESSOR_BUILDING_IDS, type TYPE_PROCESSOR_BUILDING_IDS} from './modules/processor-service.js';
import {IndustryPlan} from './modules/industry-plan.js';
import {IndustryPlanJSON, industryPlanService} from './modules/industry-plan-service.js';

const savedIndustryPlanJSON: IndustryPlanJSON = JSON.parse(localStorage.getItem('testPlan') as string);

if (savedIndustryPlanJSON) {
    console.log(`--- LOADING savedIndustryPlanJSON:`, savedIndustryPlanJSON); //// TEST
    industryPlanService.loadIndustryPlanJSON(savedIndustryPlanJSON);
} else {
    console.log(`--- MOCKING new industry plan`); //// TEST
    const testIndustryPlan = new IndustryPlan('Test Plan');

    // Test add startup products
    const testStartupProductIds = ['3', '15', '23', '44', '48', '52', '55', '81'];
    testIndustryPlan.batchAddStartupProductsByIds(testStartupProductIds);

    // Test add processors + processes into the last industry tier
    const testProcessorsAndProcesses = [
        {id: PROCESSOR_BUILDING_IDS.EXTRACTOR, processIds: [1, 5, 6, 8, 19]},
        {id: PROCESSOR_BUILDING_IDS.BIOREACTOR, processIds: []},
        {id: PROCESSOR_BUILDING_IDS.REFINERY, processIds: [24, 91, 82]},
        {id: PROCESSOR_BUILDING_IDS.FACTORY, processIds: [57, 58, 161]},
        {id: PROCESSOR_BUILDING_IDS.SHIPYARD, processIds: [252, 222]},
        {id: PROCESSOR_BUILDING_IDS.EMPTY_LOT, processIds: [306]},
    ];
    testProcessorsAndProcesses.forEach(processorData => {
        const industryTier = testIndustryPlan.getIndustryTierLast();
        const processor = industryTier.addProcessorById(processorData.id);
        processorData.processIds.forEach(processId => {
            processor.addProcessById(processId);
        });
    });

    console.log(`--- testIndustryPlan:`, testIndustryPlan); //// TEST
    console.log(`---> JSON:`, industryPlanService.getIndustryPlanJSON()); //// TEST
}
