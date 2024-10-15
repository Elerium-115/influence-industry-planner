import {industryPlanService} from './modules/industry-plan-service.js';
import {minimapService} from './modules/minimap-service.js';

// Expose services for inline scripts in HTML - e.g. "onclick"
global.industryPlanService = industryPlanService;
global.minimapService = minimapService;

// Pre-load the latest saved industry plan, if any
const latestSavedIndustryPlanJSON = industryPlanService.getLatestSavedIndustryPlanJSON();
if (latestSavedIndustryPlanJSON) {
    industryPlanService.loadIndustryPlanJSON(latestSavedIndustryPlanJSON);
} else {
    loadExamplePlan();
}

async function loadExamplePlan(): Promise<void> {
    const examplePlanResponse = await fetch('/data/example-plan.json');
    const examplePlanJSON = await examplePlanResponse.json();
    industryPlanService.loadIndustryPlanJSON(examplePlanJSON);
}
