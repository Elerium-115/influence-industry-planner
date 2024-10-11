import {IndustryPlan} from './industry-plan.js';
import {industryPlanService} from './industry-plan-service.js';
import {StartupProduct} from './startup-product.js';
import {PROCESSOR_COLOR_BY_BUILDING_ID, PROCESSOR_COLOR_FADED_BY_BUILDING_ID} from './processor-service.js';
import {ProductIcon} from './product-icon.js';

interface LineDataWithTarget {
    line: any, // LeaderLine instance
    elTarget: HTMLElement,
}

const LeaderLineOptions = {
    dash: {animation: true, len: 6, gap: 6},
    dropShadow: {dx: 0, dy: 6, blur: 0},
    endPlugSize: 2,
    gradient: true,
    size: 1,
    startPlug: 'disc',
    startPlugSize: 2,
};

const LeaderLineColorDefault = 'rgba(255, 255, 255, 0.5)';

/**
 * Singleton
 */
class LeaderLineService {
    private static instance: LeaderLineService;

    constructor() {}

    public static getInstance(): LeaderLineService {
        if (!LeaderLineService.instance) {
            LeaderLineService.instance = new LeaderLineService();
        }
        return LeaderLineService.instance;
    }

    private getLineTargetsForStartupProduct(startupProduct: StartupProduct): HTMLElement[] {
        // Line targets = same product @ inputs of HIGHER-tier processes
        return (industryPlanService.getIndustryPlan() as IndustryPlan)
            .getAllInputsMatchingProductId(startupProduct.getId())
            .map(input => input.getHtmlElement());
    }

    private getLineTargetsForOutput(output: ProductIcon): HTMLElement[] {
        // Line targets = same product @ inputs of HIGHER-tier processes
        const minimumTierId = output.getParentProcess().getParentProcessor().getParentIndustryTier().getId() + 1;
        return (industryPlanService.getIndustryPlan() as IndustryPlan)
            .getAllInputsMatchingProductId(output.getId(), minimumTierId)
            .map(input => input.getHtmlElement());
    }

    private makeLineDataForStartupProduct(startupProduct: StartupProduct, elTarget: HTMLElement): LineDataWithTarget {
        const line = new LeaderLine(
            startupProduct.getHtmlElement(),
            elTarget,
            {...LeaderLineOptions, color: LeaderLineColorDefault},
        );
        const lineData: LineDataWithTarget = {
            line,
            elTarget,
        };
        return lineData;
    }

    private makeLineDataForOutput(output: ProductIcon, elTarget: HTMLElement): LineDataWithTarget {
        const processorId = output.getParentProcess().getParentProcessor().getId();
        const line: any = new LeaderLine(
            output.getHtmlElement(),
            elTarget,
            {...LeaderLineOptions, color: PROCESSOR_COLOR_FADED_BY_BUILDING_ID[processorId]},
        );
        const lineData: LineDataWithTarget = {
            line,
            elTarget,
        };
        return lineData;
    }

    public refreshLines(): void {
        const industryPlan = industryPlanService.getIndustryPlan() as IndustryPlan;
        // Refresh lines from startup products
        industryPlan.getStartupProducts().forEach(startupProduct => {
            // FIRST: skip startup product without lines
            if (!startupProduct.getLines().length) {
                return;
            }
            // THEN: reposition valid lines, and remove lines to any inputs that have been removed
            const linesToRemove: LineDataWithTarget[] = [];
            startupProduct.getLines().forEach(lineData => {
                if (document.contains(lineData.elTarget)) {
                    lineData.line.position();
                } else {
                    // Mark the lines to be removed, AFTER the list of lines has been parsed
                    linesToRemove.push(lineData);
                }
            });
            startupProduct.removeLinesByList(linesToRemove);
            // FINALLY: add lines to any newly added inputs (inside newly added processes)
            const elTargets = this.getLineTargetsForStartupProduct(startupProduct);
            elTargets.forEach(elTarget => {
                if (startupProduct.getLines().some(lineData => lineData.elTarget === elTarget)) {
                    // Skip target if it already has a line
                    return;
                }
                const lineData = this.makeLineDataForStartupProduct(startupProduct, elTarget);
                startupProduct.addLineData(lineData);
            });
            startupProduct.markHasLines();
        });
        // Refresh lines from outputs
        industryPlan.getAllOutputsInPlan().forEach(output => {
            // FIRST: skip outputs without lines
            if (!output.getLines().length) {
                return;
            }
            // THEN: reposition valid lines, and remove lines to any inputs that have been removed
            const linesToRemove: LineDataWithTarget[] = [];
            output.getLines().forEach(lineData => {
                if (document.contains(lineData.elTarget)) {
                    lineData.line.position();
                } else {
                    // Mark the lines to be removed, AFTER the list of lines has been parsed
                    linesToRemove.push(lineData);
                }
            });
            output.removeLinesByList(linesToRemove);
            // FINALLY: add lines to any newly added inputs (inside newly added processes)
            const elTargets = this.getLineTargetsForOutput(output);
            elTargets.forEach(elTarget => {
                if (output.getLines().some(lineData => lineData.elTarget === elTarget)) {
                    // Skip target if it already has a line
                    return;
                }
                const lineData = this.makeLineDataForOutput(output, elTarget);
                output.addLineData(lineData);
            });
        });
        this.markHasLines();
    }

    public toggleLinesForStartupProduct(startupProduct: StartupProduct): void {
        if (startupProduct.getLines().length) {
            startupProduct.removeAllLines();
        } else {
            const elTargets = this.getLineTargetsForStartupProduct(startupProduct);
            elTargets.forEach(elTarget => {
                const lineData = this.makeLineDataForStartupProduct(startupProduct, elTarget);
                startupProduct.addLineData(lineData);
            });
        }
        startupProduct.markHasLines();
        this.markHasLines();
    }

    public increaseLinesForStartupProduct(startupProduct: StartupProduct): void {
        startupProduct.getLines().forEach(lineData => {
            lineData.line.color = 'white';
            lineData.line.endPlugSize = 1.5;
            lineData.line.size = 2;
            lineData.line.startPlugSize = 1.5;
        });
    }

    public decreaseLinesForStartupProduct(startupProduct: StartupProduct): void {
        startupProduct.getLines().forEach(lineData => {
            lineData.line.color = LeaderLineColorDefault;
            lineData.line.endPlugSize = 2;
            lineData.line.size = 1;
            lineData.line.startPlugSize = 2;
        });
    }

    public toggleLinesForOutput(output: ProductIcon): void {
        if (output.getLines().length) {
            output.removeAllLines();
        } else {
            const elTargets = this.getLineTargetsForOutput(output);
            elTargets.forEach(elTarget => {
                const lineData = this.makeLineDataForOutput(output, elTarget);
                output.addLineData(lineData);
            });
        }
        output.markHasLines();
        this.markHasLines();
    }

    public increaseLinesForOutput(output: ProductIcon): void {
        const processorId = output.getParentProcess().getParentProcessor().getId();
        output.getLines().forEach(lineData => {
            lineData.line.color = PROCESSOR_COLOR_BY_BUILDING_ID[processorId];
            lineData.line.endPlugSize = 1.5;
            lineData.line.size = 2;
            lineData.line.startPlugSize = 1.5;
        });
    }

    public decreaseLinesForOutput(output: ProductIcon): void {
        const processorId = output.getParentProcess().getParentProcessor().getId();
        output.getLines().forEach(lineData => {
            lineData.line.color = PROCESSOR_COLOR_FADED_BY_BUILDING_ID[processorId];
            lineData.line.endPlugSize = 2;
            lineData.line.size = 1;
            lineData.line.startPlugSize = 2;
        });
    }

    public removeAllLines(): void {
        const industryPlan = industryPlanService.getIndustryPlan() as IndustryPlan;
        industryPlan.getAllProductsInPlan().forEach(product => product.removeAllLines());
        this.markHasLines();
    }

    public markHasLines(): void {
        const industryPlan = industryPlanService.getIndustryPlan() as IndustryPlan;
        const hasLines = industryPlan.getAllProductsInPlan().some(product => product.getLines().length);
        industryPlan.getHtmlElement().classList.toggle('has-lines', hasLines);
    }
}

const leaderLineService: LeaderLineService = LeaderLineService.getInstance(); // singleton

export {
    LineDataWithTarget,
    leaderLineService,
}
