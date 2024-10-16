import {industryPlanService} from './modules/industry-plan-service.js';
import {minimapService} from './modules/minimap-service.js';
import {OverlayCreateIndustryPlan} from './modules/overlays/overlay-create-industry-plan.js';

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
    try {
        const examplePlanResponse = await fetch('/data/example-plan.json');
        const examplePlanJSON = await examplePlanResponse.json();
        industryPlanService.loadIndustryPlanJSON(examplePlanJSON);
    } catch (error: any) {
        // Prompt the user to create a new industry plan
        new OverlayCreateIndustryPlan();
    }
}
