import {IndustryPlan} from './industry-plan.js';
import {industryPlanService} from './industry-plan-service.js';
import {StartupProduct} from './startup-product.js';
import {Processor} from './processor.js';
import {PROCESSOR_COLOR_BY_BUILDING_ID, PROCESSOR_COLOR_FADED_BY_BUILDING_ID} from './processor-service.js';
import {Process} from './process.js';
import {ProductIcon} from './product-icon.js';
import {ProductAny} from './product-service.js';

interface LineDataWithTarget {
    line: any, // LeaderLine instance
    elTarget: HTMLElement,
}

const LeaderLineOptions = {
    // dash: {animation: true, len: 6, gap: 6}, //// DISABLED for performance
    // dropShadow: {dx: 0, dy: 6, blur: 0}, //// DISABLED for visibility
    endPlugSize: 2,
    gradient: true,
    size: 1,
    startPlug: 'disc',
    startPlugSize: 2,
};

const LeaderLineColorDefault = 'white';
const LeaderLineColorFadedDefault = 'rgba(255, 255, 255, 0.25)';

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

    private getLineTargetsForStartupProduct(startupProduct: StartupProduct): ProductIcon[] {
        // Line targets = same product @ inputs of HIGHER-tier processes
        return (industryPlanService.getIndustryPlan() as IndustryPlan)
            .getAllInputsMatchingProductId(startupProduct.getId());
    }

    private getLineTargetsForOutput(output: ProductIcon): ProductIcon[] {
        // Line targets = same product @ inputs of HIGHER-tier processes
        const minimumTierId = output.getParentProcess().getParentProcessor().getParentIndustryTier().getId() + 1;
        return (industryPlanService.getIndustryPlan() as IndustryPlan)
            .getAllInputsMatchingProductId(output.getId(), minimumTierId);
    }

    private getLineSourcesForInput(input: ProductIcon): ProductAny[] {
        return (industryPlanService.getIndustryPlan() as IndustryPlan).getSourcesForInput(input, false);
    }

    private makeLineDataForStartupProduct(startupProduct: StartupProduct, elTarget: HTMLElement): LineDataWithTarget {
        const line = new LeaderLine(
            startupProduct.getHtmlElement(),
            elTarget,
            {...LeaderLineOptions, color: LeaderLineColorFadedDefault},
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

    private makeLineDataForInput(source: ProductAny, input: ProductIcon): LineDataWithTarget {
        let color = LeaderLineColorFadedDefault;
        if (source instanceof ProductIcon) {
            // Actual output product, NOT startup product
            const processorId = source.getParentProcess().getParentProcessor().getId();
            color = PROCESSOR_COLOR_FADED_BY_BUILDING_ID[processorId];
        }
        const line: any = new LeaderLine(
            source.getHtmlElement(),
            input.getHtmlElement(),
            {...LeaderLineOptions, color},
        );
        const lineData: LineDataWithTarget = {
            line,
            elTarget: input.getHtmlElement(),
        };
        return lineData;
    }

    public makeLineDataForOverlayAddProcess(elAvailableInput: HTMLElement, elTarget: HTMLElement): LineDataWithTarget {
        const line = new LeaderLine(
            elAvailableInput,
            elTarget,
            {...LeaderLineOptions, color: LeaderLineColorDefault, startSocketGravity: 50, endSocketGravity: 50},
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
            const targets = this.getLineTargetsForStartupProduct(startupProduct);
            targets.forEach(target => {
                const elTarget = target.getHtmlElement();
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
            const targets = this.getLineTargetsForOutput(output);
            targets.forEach(target => {
                const elTarget = target.getHtmlElement();
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
            const targets = this.getLineTargetsForStartupProduct(startupProduct);
            targets.forEach(target => {
                const lineData = this.makeLineDataForStartupProduct(startupProduct, target.getHtmlElement());
                startupProduct.addLineData(lineData);
            });
        }
        startupProduct.markHasLines();
        this.markHasLines();
    }

    public toggleLinesForOutput(output: ProductIcon): void {
        if (output.getLines().length) {
            output.removeAllLines();
        } else {
            const targets = this.getLineTargetsForOutput(output);
            targets.forEach(target => {
                const lineData = this.makeLineDataForOutput(output, target.getHtmlElement());
                output.addLineData(lineData);
            });
        }
        output.markHasLines();
        this.markHasLines();
    }

    public toggleLinesForInput(input: ProductIcon): void {
        // Toggle lines from sources of this input, to this input
        const sources = this.getLineSourcesForInput(input);
        if (sources.some(source => source.getLineToElTarget(input.getHtmlElement()))) {
            // At least one source of this input, has a line to this input => REMOVE lines to this input
            sources.forEach(source => {
                // Get and remove the line to this input
                const lineData = source.getLineToElTarget(input.getHtmlElement());
                if (lineData) {
                    source.removeLinesByList([lineData]);
                    source.markHasLines();
                }
            });
        } else {
            // No line from any source of this input, to this input => ADD lines to this input
            sources.forEach(source => {
                const lineData = this.makeLineDataForInput(source, input);
                source.addLineData(lineData);
                source.markHasLines();
            });
        }
        this.markHasLines();
    }

    public increaseLinesForStartupProduct(startupProduct: StartupProduct): void {
        startupProduct.getLines().forEach(lineData => {
            lineData.line.color = LeaderLineColorDefault;
            lineData.line.endPlugSize = 1.5;
            lineData.line.size = 2;
            lineData.line.startPlugSize = 1.5;
        });
    }

    public decreaseLinesForStartupProduct(startupProduct: StartupProduct): void {
        startupProduct.getLines().forEach(lineData => {
            lineData.line.color = LeaderLineColorFadedDefault;
            lineData.line.endPlugSize = 2;
            lineData.line.size = 1;
            lineData.line.startPlugSize = 2;
        });
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

    public increaseLinesForInput(input: ProductIcon): void {
        const sources = this.getLineSourcesForInput(input);
        sources.forEach(source => {
            const lineData = source.getLineToElTarget(input.getHtmlElement());
            if (!lineData) {
                return;
            }
            let color = LeaderLineColorDefault;
            if (source instanceof ProductIcon) {
                // Actual output product, NOT startup product
                const processorId = source.getParentProcess().getParentProcessor().getId();
                color = PROCESSOR_COLOR_BY_BUILDING_ID[processorId];
            }
            lineData.line.color = color;
            lineData.line.endPlugSize = 1.5;
            lineData.line.size = 2;
            lineData.line.startPlugSize = 1.5;
        });
    }

    public decreaseLinesForInput(input: ProductIcon): void {
        const sources = this.getLineSourcesForInput(input);
        sources.forEach(source => {
            const lineData = source.getLineToElTarget(input.getHtmlElement());
            if (!lineData) {
                return;
            }
            let color = LeaderLineColorFadedDefault;
            if (source instanceof ProductIcon) {
                // Actual output product, NOT startup product
                const processorId = source.getParentProcess().getParentProcessor().getId();
                color = PROCESSOR_COLOR_FADED_BY_BUILDING_ID[processorId];
            }
            lineData.line.color = color;
            lineData.line.endPlugSize = 2;
            lineData.line.size = 1;
            lineData.line.startPlugSize = 2;
        });
    }

    public removeAllLines(): void {
        const industryPlan = industryPlanService.getIndustryPlan() as IndustryPlan;
        industryPlan.getAllProductsInPlan().forEach(product => product.removeAllLines());
        industryPlan.getAllProcessesInPlan().forEach(process => process.setIsActiveLines(false));
        this.markHasLines();
    }

    public markHasLines(): void {
        const industryPlan = industryPlanService.getIndustryPlan() as IndustryPlan;
        const hasLines = industryPlan.getAllProductsInPlan().some(product => product.getLines().length);
        industryPlan.getHtmlElement().classList.toggle('has-lines', hasLines);
    }

    /**
     * Recursive function which ends after rendering the
     * "preferred lines" for all "inputs" and their sub-chains.
     * 
     * NOTE: This function assumes there are NO lines in the plan.
     */
    private addPreferredLinesForInputs(inputs: ProductIcon[]): void {
        inputs.forEach(input => {
            // Add "preferred line" for this input, and then recursively for the inputs in the "source" process
            const sources = this.getLineSourcesForInput(input);
            const preferredSource = industryPlanService.getPreferredSource(sources);
            if (!preferredSource) {
                // console.warn(`--- WARNING: [addPreferredLinesForInputs] no source for input "${input.getName()}".`);
                // Exit this recursion branch re: NO source for input
                return;
            }
            // Ensure NO other line from the preferred source, to this input
            if (preferredSource.getLineToElTarget(input.getHtmlElement())) {
                // Exit this recursion re: sub-chain already parsed
                return;
            }
            // Add line from the preferred source, to this input
            const lineData = this.makeLineDataForInput(preferredSource, input);
            preferredSource.addLineData(lineData);
            preferredSource.markHasLines();
            if (preferredSource instanceof ProductIcon) {
                // NOT startup product => add preferred lines for all inputs of "preferredSource", if any
                this.addPreferredLinesForInputs(preferredSource.getParentProcess().getInputs());
            }
        });
    }

    public toggleLinesForProcess(process: Process): void {
        // Save this flag, before resetting it via "removeAllLines"
        const wasActiveLines = process.getIsActiveLines();
        // Always remove all lines, as the first step in this handler
        this.removeAllLines();
        if (wasActiveLines) {
            // Toggle lines OFF (done)
            return;
        }
        // Toggle lines ON
        this.addPreferredLinesForInputs(process.getInputs());
        process.setIsActiveLines(true);
        this.markHasLines();
    }

    public removeLinesForProcess(process: Process): void {
        // Remove lines for all inputs and outputs in this process
        [...process.getInputs(), ...process.getOutputs()].forEach(product => product.removeAllLines());
        process.setIsActiveLines(false);
        this.markHasLines();
    }

    public removeLinesForProcessor(processor: Processor): void {
        // Remove lines for all processes in this processor
        processor.getProcesses().forEach(process => this.removeLinesForProcess(process));
    }
}

const leaderLineService: LeaderLineService = LeaderLineService.getInstance(); // singleton

export {
    LineDataWithTarget,
    leaderLineService,
}
