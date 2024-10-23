import {PlannedProductJSON, industryPlanService} from './modules/industry-plan-service.js';
import {starknetService} from './modules/starknet-service.js';
import {minimapService} from './modules/minimap-service.js';
import {OverlayCreateIndustryPlan} from './modules/overlays/overlay-create-industry-plan.js';

// Expose services for inline scripts in HTML - e.g. "onclick"
global.industryPlanService = industryPlanService;
global.starknetService = starknetService;
global.minimapService = minimapService;

// Generate industry plan if planned product JSON in URL
const urlParams = new URLSearchParams(location.search);
const plannedProductJSON: PlannedProductJSON|null = JSON.parse(urlParams.get('planned-product-json') || 'null');
if (plannedProductJSON) {
    industryPlanService.generateIndustryPlanFromPlannedProductJSON(plannedProductJSON);
} else {
    // Pre-load the latest saved industry plan (if any), or the example plan
    const latestSavedIndustryPlanJSON = industryPlanService.getLatestSavedIndustryPlanJSON();
    if (latestSavedIndustryPlanJSON) {
        industryPlanService.loadIndustryPlanJSON(latestSavedIndustryPlanJSON);
    } else {
        loadExamplePlan();
    }
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

minimapService.resetMinimap();
