import * as InfluenceSDK from '@influenceth/sdk';
import {uniquePushToArray} from './abstract-core.js';
import {IndustryPlan} from './industry-plan.js';
import {IndustryTier} from './industry-tier.js';
import {Processor} from './processor.js';
import {
    TYPE_PROCESSOR_BUILDING_IDS,
    MOCK_PROCESSOR_ID_EXTRACTOR,
    SDK_PROCESSOR_IDS_BY_BUILDING_ID,
    processorService,
} from './processor-service.js';
import {Process} from './process.js';
import {I_PROCESS_DATA, processService} from './process-service.js';
import {ProductSelectable} from './product-selectable.js';
import {productService} from './product-service.js';
import {OverlayCreateIndustryPlan} from './overlays/overlay-create-industry-plan.js';
import {OverlayMyIndustryPlans} from './overlays/overlay-my-industry-plans.js';
import {OverlaySharedIndustryPlans} from './overlays/overlay-shared-industry-plans.js';

interface IndustryPlanJSON {
    id: string,
    title: string,
    updatedTs: number,
    scientistsInCrew: number,
    startupProductIds: string[],
    industryTiers: IndustryTierJSON[],
}

interface IndustryTierJSON {
    processors: ProcessorJSON[],
}

interface ProcessorJSON {
    id: TYPE_PROCESSOR_BUILDING_IDS,
    processes: ProcessJSON[],
};

interface ProcessJSON {
    id: number,
    primaryOutputId: string,
};

interface I_PROCESS_DATA_WITH_PRIMARY_OUTPUT_PRODUCT_ID extends I_PROCESS_DATA {
    primaryOutputProductId: string,
}

/**
 * Singleton
 */
class IndustryPlanService {
    private static instance: IndustryPlanService;

    /**
     * Currently loaded industry plan, if any
     */
    private industryPlan: IndustryPlan|null = null;

    private shouldReuseProcessorsWhenGeneratingPlan: boolean = true;

    /**
     * During "generatePlanForTargetProductIds", this will be populated
     * with the processes that need to be added into the industry plan
     * (with a primary output associated with each process),
     * in order to obtain the target products.
     */
    private plannedProcesses: I_PROCESS_DATA_WITH_PRIMARY_OUTPUT_PRODUCT_ID[] = [];

    /**
     * During "generatePlanForTargetProductIds", this will be populated
     * with any products which trigger the "error.cause" handler.
     * That handler ends up retrying "generatePlanForTargetProductIds"
     * with this temporarily-extended list of startup products.
     */
    private tempStartupProductIds: string[] = [];

    /**
     * During "generatePlanForTargetProductIds", this will be populated
     * with the products which gradually become available as inputs,
     * for upcoming processes that remain to be planned, plus any
     * "tempStartupProductIds" added by the "error.cause" handler.
     */
    private availableInputProductIds: string[] = [];

    constructor() {
        /**
         * NOTE: These operations can not be done from "ProductService" or "ProcessService",
         * as that would lead to a circular dependency between those services and/or other classes.
         */
        // Populate empty outputs in the SDK data (for ships and buildings)
        this.updateProcessesWithEmptyOutputs();
        // Generate IDs of products which are used as inputs for at least one process
        this.populateInputProductIds();
        // Add extractions into processes
        this.addExtractionsIntoProcesses();
        // Map raw materials to their category (Volatile etc.)
        productService.mapRawMaterialsToCategories();
    }

    public static getInstance(): IndustryPlanService {
        if (!IndustryPlanService.instance) {
            IndustryPlanService.instance = new IndustryPlanService();
        }
        return IndustryPlanService.instance;
    }

    public setIndustryPlan(industryPlan: IndustryPlan): void {
        this.industryPlan = industryPlan;
    }

    public isIndustryPlanLoadedButNotSaved(): boolean {
        return Boolean(this.industryPlan && !this.industryPlan.getIsSaved());
    }

    public isReservedPlanTitle(planTitle: string): boolean {
        return this.getSavedIndustryPlansJSON().some(industryPlanJSON => industryPlanJSON.title === planTitle);
    }

    public onRemoveIndustryPlan(): void {
        // Remove this industry plan form local-storage
        this.removeIndustryPlanJSON();
        // Finish removing this industry plan
        this.industryPlan = null;
        // Show list of remaining saved industry plans
        new OverlayMyIndustryPlans();
    }

    public onClickCreateIndustryPlan(): void {
        new OverlayCreateIndustryPlan();
    }

    public onClickMyIndustryPlans(): void {
        new OverlayMyIndustryPlans();
    }

    public onClickSharedIndustryPlans(): void {
        new OverlaySharedIndustryPlans();
    }

    public getSavedIndustryPlansJSON(): IndustryPlanJSON[] {
        return JSON.parse(localStorage.getItem('savedIndustryPlans') as string) || [];
    }

    public getLatestSavedIndustryPlanJSON(): IndustryPlanJSON|null {
        const savedIndustryPlansJSON = industryPlanService.getSavedIndustryPlansJSON();
        if (!savedIndustryPlansJSON.length) {
            return null;
        }
        savedIndustryPlansJSON.sort(this.compareIndustryPlanJSONByUpdatedTsDesc);
        return savedIndustryPlansJSON[0];
    }

    private compareIndustryPlanJSONByUpdatedTsDesc(p1: IndustryPlanJSON, p2: IndustryPlanJSON): number {
        return p2.updatedTs - p1.updatedTs;
    }

    private makeIndustryPlanJSON(): IndustryPlanJSON {
        if (!this.industryPlan) {
            throw Error('ERROR: industryPlan not set @ makeIndustryPlanJSON');
        }
        const industryPlanJSON: IndustryPlanJSON = {
            id: this.industryPlan.getId(),
            title: this.industryPlan.getTitle(),
            updatedTs: this.industryPlan.getUpdatedTs(),
            scientistsInCrew: this.industryPlan.getScientistsInCrew(),
            startupProductIds: this.industryPlan.getStartupProducts().map(product => product.getId()),
            industryTiers: [],
        };
        this.industryPlan.getIndustryTiers().forEach(industryTier => {
            const industryTierJSON: IndustryTierJSON = {
                processors: [],
            };
            if (!industryTier.getProcessors().length) {
                return;
            }
            industryTier.getProcessors().forEach(processor => {
                const processorJSON: ProcessorJSON = {
                    id: processor.getId(),
                    processes: [],
                };
                processor.getProcesses().forEach(process => {
                    const processJSON: ProcessJSON = {
                        id: process.getId() as number,
                        primaryOutputId: process.getPrimaryOutputId(),
                    };
                    processorJSON.processes.push(processJSON);
                });
                industryTierJSON.processors.push(processorJSON);
            });
            industryPlanJSON.industryTiers.push(industryTierJSON);
        });
        return industryPlanJSON;
    }

    public saveIndustryPlanJSON(): void {
        const loadedIndustryPlanJSON = this.makeIndustryPlanJSON();
        const savedIndustryPlansJSON = industryPlanService.getSavedIndustryPlansJSON();
        // Find the industry plan from local-storage matching the currently loaded industry plan
        let matchingIdx = savedIndustryPlansJSON.findIndex(industryPlanJSON => industryPlanJSON.id === loadedIndustryPlanJSON.id);
        if (matchingIdx !== -1) {
            // Update the matching industry plan
            savedIndustryPlansJSON[matchingIdx] = loadedIndustryPlanJSON;
        } else {
            // Newly saved industry plan
            savedIndustryPlansJSON.push(loadedIndustryPlanJSON);
        }
        // Commit all saved industry plans into local-storage
        localStorage.setItem('savedIndustryPlans', JSON.stringify(savedIndustryPlansJSON));
    }

    public loadIndustryPlanJSON(industryPlanJSON: IndustryPlanJSON): void {
        const loadedIndustryPlan = new IndustryPlan(
            industryPlanJSON.title,
            industryPlanJSON.scientistsInCrew,
            industryPlanJSON.id,
        );
        // Start loading
        loadedIndustryPlan.setIsLoading(true);
        // Add startup products
        loadedIndustryPlan.batchAddStartupProductsByIds(industryPlanJSON.startupProductIds);
        // Add industry tiers
        industryPlanJSON.industryTiers.forEach(industryTierJSON => {
            const industryTier = loadedIndustryPlan.getIndustryTierLast();
            // Add processors into this industry tier
            industryTierJSON.processors.forEach(processorJSON => {
                const processor = industryTier.addProcessorById(processorJSON.id);
                // Add processes into this processor
                processorJSON.processes.forEach(processJSON => {
                    processor.addProcessById(processJSON.id);
                    const addedProcess = processor.getProcesses().slice(-1)[0];
                    const primaryOutput = addedProcess.getOutputs().find(output => output.getId() === processJSON.primaryOutputId);
                    if (primaryOutput) {
                        addedProcess.setPrimaryOutput(primaryOutput);
                    }
                });
            });
        });
        loadedIndustryPlan.markHasSecondaryOutputs();
        loadedIndustryPlan.setSavedStatusAndIcon(true);
        // Finish loading
        loadedIndustryPlan.setIsLoading(false);
        this.industryPlan = loadedIndustryPlan;
    }

    public removeIndustryPlanJSON(): void {
        let savedIndustryPlansJSON = industryPlanService.getSavedIndustryPlansJSON();
        savedIndustryPlansJSON = savedIndustryPlansJSON.filter(industryPlanJSON => industryPlanJSON.id !== this.industryPlan?.getId());
        // Commit remaining saved industry plans into local-storage
        localStorage.setItem('savedIndustryPlans', JSON.stringify(savedIndustryPlansJSON));
    }

    public getAvailableInputsForIndustryTier(targetIndustryTier: IndustryTier): ProductSelectable[] {
        if (!this.industryPlan) {
            throw Error('ERROR: industryPlan not set @ getAvailableInputsForIndustryTier');
        }
        const availableInputs: ProductSelectable[] = [];
        // Add startup products
        this.industryPlan.getStartupProducts().forEach(startupProduct => {
            const startupProductId = startupProduct.getId();
            if (!productService.isInputProductId(startupProductId)) {
                // Product not an input for any process
                return;
            }
            availableInputs.push(new ProductSelectable(startupProductId));
        });
        // Add outputs from lower industry tiers
        this.industryPlan.getIndustryTiers().some(industryTier => {
            if (industryTier === targetIndustryTier) {
                // Target industry tier reached => stop parsing industry tiers
                return true;
            }
            // Parse outputs of all processes, from all processors, in this industry tier
            industryTier.getProcessors().forEach(processor => {
                processor.getProcesses().forEach(process => {
                    process.getOutputs().forEach(outputProduct => {
                        const outputProductId = outputProduct.getId();
                        if (availableInputs.find(product => product.getId() === outputProductId)) {
                            // Product already added
                            return ;
                        }
                        if (!productService.isInputProductId(outputProductId)) {
                            // Product not an input for any process
                            return;
                        }
                        availableInputs.push(new ProductSelectable(outputProduct.getId()));
                    });
                });
            });
        });
        productService.sortProductsByName(availableInputs);
        return availableInputs;
    }

    public getEligibleProcessesForProcessorUsingInputs(processor: Processor, availableInputs: ProductSelectable[]): I_PROCESS_DATA[] {
        const assignedProcessIds = processor.getProcesses().map(assignedProcess => assignedProcess.getId());
        const selectedInputsProductIds = availableInputs
            .filter(availableInput => availableInput.getIsSelected())
            .map(availableInput => availableInput.getId());
        // SDK-processors associated with this processor-building
        const sdkProcessorIds = SDK_PROCESSOR_IDS_BY_BUILDING_ID[processor.getId()];
        const eligibleProcesses = Object.values(processService.getAllProcessesData())
            // Exclude processes already assigned to this processor-building
            .filter(processData => !assignedProcessIds.includes(processData.i))
            // Keep only processes that can be run by one of the SDK-processors
            .filter(processData => sdkProcessorIds.includes(processData.processorType))
            // Keep only processes that can be run with the selected inputs
            .filter(processData => Object.keys(processData.inputs).every(inputProductId => selectedInputsProductIds.includes(inputProductId)));
        processService.sortProcessesByName(eligibleProcesses);
        return eligibleProcesses;
    }

    public getEligibleProcessesUsingInputs(availableInputs: ProductSelectable[]): I_PROCESS_DATA[] {
        const availableInputsProductIds = availableInputs.map(availableInput => availableInput.getId());
        return Object.values(processService.getAllProcessesData())
            // Keep only processes that can be run with the available inputs
            .filter(processData => Object.keys(processData.inputs).every(inputProductId => availableInputsProductIds.includes(inputProductId)));
    }

    private updateProcessesWithEmptyOutputs(): void {
        Object.values(processService.getAllProcessesData()).forEach(processData => {
            if (Object.keys(processData.outputs).length) {
                return;
            }
            switch (processData.processorType) {
                case InfluenceSDK.Processor.IDS.DRY_DOCK: {
                    // Hardcode output = ship
                    const productData = productService.getProductDataForShipIntegration(processData.name);
                    if (productData) {
                        // Hardcode qty = 1
                        processData.outputs = {[productData.i]: 1};
                    }
                    break;
                }
                case InfluenceSDK.Processor.IDS.CONSTRUCTION: {
                    // Hardcode output = building
                    const productData = productService.getProductDataForBuildingConstruction(processData.name);
                    if (productData) {
                        // Hardcode qty = 1
                        processData.outputs = {[productData.i]: 1};
                    }
                    break;
                }
            }
        });
    }

    private populateInputProductIds(): void {
        const inputProductIds = productService.getInputProductIds();
        Object.values(processService.getAllProcessesData()).forEach(processData => {
            Object.keys(processData.inputs).forEach(inputProductId => {
                uniquePushToArray(inputProductIds, inputProductId);
            });
        });
    }

    private addExtractionsIntoProcesses(): void {
        // Determine min / max ID of standard processes (non-extraction)
        let minProcessId: number|null = null;
        let maxProcessId = 0;
        Object.values(processService.getAllProcessesData()).forEach(processData => {
            minProcessId = minProcessId !== null ? Math.min(minProcessId, processData.i) : processData.i;
            maxProcessId = Math.max(maxProcessId, processData.i);
        });
        /**
         * Add extractions into processes
         * - e.g. raw material "Water" => process "Water Extraction"
         *
         * NOTE:
         * - Ideally, the extraction processes are injected before the standard processes.
         *   This requires the number of extraction processes to be smaller than "minProcessId"
         *   (e.g. if there are 22 extraction processes, "minProcessId" should be at least 23).
         *   In this case, the IDs of extraction processes are incremented starting from 1.
         * - Otherwise, the extraction processes are injected after the standard processes,
         *   and their IDs are incremented starting from "maxProcessId" + 1.
         */
        const rawMaterialProductIds = productService.getRawMaterialProductIds();
        rawMaterialProductIds.forEach((productId, idx) => {
            const productName = productService.getProductNameById(productId.toString());
            const processData: I_PROCESS_DATA = {
                i: 0, // to be updated below
                name: `${productName} Extraction`, // e.g. "Water Extraction"
                processorType: MOCK_PROCESSOR_ID_EXTRACTOR,
                setupTime: 0,
                recipeTime: 0,
                inputs: {},
                outputs: {[productId]: 1}, // output qty = 1
            };
            if (minProcessId !== null && rawMaterialProductIds.length < minProcessId) {
                processData.i = idx + 1;
            } else {
                processData.i = ++maxProcessId;
            }
            processService.setProcessDataById(processData);
            // Also map extraction process IDs to raw material IDs, for convenience
            processService.setExtractionProcessIdByRawMaterialId(productId, processData.i);
        });
    }

    private isExtractionByProcessData(processData: I_PROCESS_DATA): boolean {
        const inputProductIds = Object.keys(processData.inputs);
        const outputProductIds = Object.keys(processData.outputs);
        return !inputProductIds.length
            && outputProductIds.length === 1
            && productService.isRawMaterialByProductId(outputProductIds[0]);
    }

    private resetGeneratePlanData(): void {
        this.plannedProcesses = [];
        this.tempStartupProductIds = [];
        this.availableInputProductIds = [];
    }

    public async generatePlanForTargetProductIds(targetProductIds: string[], isRecursiveCall: boolean = false): Promise<void> {
        const industryPlan = this.industryPlan as IndustryPlan;
        // Initially available inputs = "startupProducts"
        this.availableInputProductIds = industryPlan.getStartupProducts().map(startupProduct => startupProduct.getId());
        // Also use any temporary startup products
        this.availableInputProductIds = [...this.availableInputProductIds, ...this.tempStartupProductIds];
        /**
         * Handle target products as inputs for a "fake" process (NULL process ID)
         * which requires all of them, and without any "ancestorOutputProductIds".
         */
        const parentProcessId = null;
        const ancestorOutputProductIds = [];
        try {
            this.planInputProductIds(targetProductIds, parentProcessId, ancestorOutputProductIds);
        } catch (error: any) {
            if (error.cause && error.cause.errorType === 'NO_VALID_PROCESS_VARIANT_FOR_OUTPUT_PRODUCT_ID') {
                /**
                 * Given the output product ID which triggered this error:
                 * - temporarily add it as a startup product
                 * - retry to generate the plan, using the "temporary startup products"
                 * - if another output product will trigger this error again, this flow will repeat
                 * - after no more errors, the plan will have been generated,
                 *   and the "temporary startup products" will need to be handled
                 */
                const outputProductId = error.cause.errorValue;
                this.tempStartupProductIds.push(outputProductId);
                this.generatePlanForTargetProductIds(targetProductIds, true);
                // Exit here for recursive calls, but continue the execution for the initial call
                if (isRecursiveCall) {
                    return;
                }
            } else {
                // Unexpected error => exit here
                alert((error as Error).message);
                this.resetGeneratePlanData();
                return;
            }
        }
        try {
            // Start adding processes from "plannedProcesses", in reverse order (e.g. extractions first)
            this.plannedProcesses.reverse().forEach(process => this.addProcessIntoGeneratedPlan(process));
        } catch (error: any) {
            // Unexpected error => exit here
            alert((error as Error).message);
            this.resetGeneratePlanData();
            return;
        }
        // Handle "temporary startup products", if any
        if (this.tempStartupProductIds.length) {
            /**
             * For each "temporary startup product":
             * - check if it's an output from any process in the generated plan
             * - for each such process, check if it can be made using the inputs available at that tier
             * - if any such process where it can NOT be made => force-add it as an actual Startup Product
             * 
             * NOTE: Subsequent "temporary startup products" may become valid outputs from some processes,
             * as a result of force-adding prior ones as actual Startup Products, during these cycles.
             */
            const forceAddedStartupProductIds: string[] = [];
            this.tempStartupProductIds.forEach(tempStartupProductId => {
                const isImpossibleOutput = industryPlan.getAllProcessesInPlan().some(process => {
                    const isOutputFromProcess = process.getOutputs().some(output => output.getId() === tempStartupProductId);
                    if (isOutputFromProcess) {
                        /**
                         * Found process which outputs this "tempStartupProductId"
                         * => check if impossible to make it using the inputs available at this tier.
                         */
                        const industryTier = process.getParentProcessor().getParentIndustryTier();
                        const availableInputProductIdsForTier = this.getAvailableInputsForIndustryTier(industryTier).map(product => product.getId());
                        return process.getInputs().some(input => !availableInputProductIdsForTier.includes(input.getId()));
                    }
                    return false;
                });
                if (isImpossibleOutput) {
                    // Force-add this "tempStartupProductId" as an actual Startup Product
                    industryPlan.addStartupProductById(tempStartupProductId, false);
                    forceAddedStartupProductIds.push(tempStartupProductId);
                }
            });
            /**
             * If any "temporary startup product" was force-added as an actual Startup Product:
             * - trigger the handler "onUpdatedStartupProducts"
             * - show a notification re: products added as Startup Products, instead of via processes
             */
            if (forceAddedStartupProductIds.length) {
                industryPlan.onUpdatedStartupProducts();
                const forceAddedStartupProductNames = forceAddedStartupProductIds.map(productId => productService.getProductNameById(productId));
                alert(`The following products could not be resolved as outputs in the generated plan, so they were added as Startup Products: ${forceAddedStartupProductNames.join(', ')}`);
            }
        }
        // All done => reset all data used during this plan generation
        this.resetGeneratePlanData();
    }

    private planInputProductIds(
        inputProductIds: string[],
        parentProcessId: number|null, // keeping this arg. for future optimizations via backtracking
        ancestorOutputProductIds: string[],
    ): void {
        inputProductIds.forEach(inputProductId => this.planProcessForOutput(inputProductId, parentProcessId, [...ancestorOutputProductIds]));
    }

    /**
     * Recursive function which ends after planning
     * all processes required to make "outputProductId".
     */
    private planProcessForOutput(
        outputProductId: string,
        parentProcessId: number|null, // keeping this arg. for future optimizations via backtracking
        ancestorOutputProductIds: string[],
    ): void {
        /**
         * Auto-select a process variant.
         * If multiple process variants:
         * - prioritize extractions, or processes which require only raw materials as inputs
         * - exclude any process requiring an input from among "ancestorOutputProductIds" (i.e. infinite loop)
         *   - also go 1 level deeper with this filtering, for each of the inputs
         * - from the remaining process variants, select the process w/ highest throughput
         */
        let allProcessVariants = processService.getProcessVariantsForOutputProductId(outputProductId);
        let filteredProcessVariants: I_PROCESS_DATA[] = [...allProcessVariants];
        // OPTIMIZATION #1
        if (productService.isRawMaterialByProductId(outputProductId)) {
            // Prioritize extractions
            filteredProcessVariants = allProcessVariants.filter(processData => this.isExtractionByProcessData(processData));
        } else if (allProcessVariants.length >= 2) {
            // Exclude any process requiring an input from among "ancestorOutputProductIds" (i.e. infinite loop)
            filteredProcessVariants = allProcessVariants.filter(processData => {
                return !Object.keys(processData.inputs).some(inputProductId => ancestorOutputProductIds.includes(inputProductId));
            });
        }
        // OPTIMIZATION #2
        if (filteredProcessVariants.length >= 2) {
            // Prioritize process variants which require only raw materials, if any
            const processVariantsFromRawMaterials = filteredProcessVariants.filter(processData => {
                // Ensure all inputs are raw materials
                return Object.keys(processData.inputs).every(inputProductId => productService.isRawMaterialByProductId(inputProductId));
            });
            if (processVariantsFromRawMaterials.length) {
                filteredProcessVariants = [...processVariantsFromRawMaterials];
            }
        }
        // OPTIMIZATION #3
        filteredProcessVariants = this.extraFilterProcessVariantsForPlannedOutputProductId(
            filteredProcessVariants,
            outputProductId,
            ancestorOutputProductIds,
        );
        if (!filteredProcessVariants.length) {
            // NO valid process variant => will retry generating the plan via workaround w/ "tempStartupProductIds"
            const errorCause = {
                cause: {
                    errorType: 'NO_VALID_PROCESS_VARIANT_FOR_OUTPUT_PRODUCT_ID',
                    errorValue: outputProductId,
                },
            };
            throw Error(`No valid process variant for "${productService.getProductNameById(outputProductId)}".`, errorCause);
        }
        // Select the preferred process, from among the filtered variants
        const selectedProcess = this.getPreferredProcessVariantForOutputProductId(outputProductId, filteredProcessVariants);
        let primaryOutputProductId = outputProductId;
        // Check if the same process was already planned, e.g. with a different primary output
        const alreadyPlannedProcess = this.plannedProcesses.find(processData => processData.i === selectedProcess.i);
        if (alreadyPlannedProcess) {
            /**
             * Remove this process, before pushing it again - to ensure it will be added earlier in the plan.
             * But preserve its initial primary output, b/c primary outputs which are planned sooner
             * (i.e. closer to the target products) are likely more valuable, in the overall plan. (TBC)
             */
            primaryOutputProductId = alreadyPlannedProcess.primaryOutputProductId;
            const idx = this.plannedProcesses.indexOf(alreadyPlannedProcess);
            this.plannedProcesses.splice(idx, 1);
        }
        this.plannedProcesses.push({
            ...selectedProcess,
            primaryOutputProductId,
        });
        // Add only the current "outputProductId" of the selected process, into "ancestorOutputProductIds"
        ancestorOutputProductIds.push(outputProductId);
        // Plan inputs which are NOT among "availableInputProductIds" (i.e. NOT startup products or "temporary startup products")
        const requiredInputProductIds = Object.keys(selectedProcess.inputs)
            .filter(inputProductId => !this.availableInputProductIds.includes(inputProductId));
        this.planInputProductIds(requiredInputProductIds, selectedProcess.i, [...ancestorOutputProductIds]);
    }

    private extraFilterProcessVariantsForPlannedOutputProductId(
        filteredProcessVariants: I_PROCESS_DATA[],
        outputProductId: string,
        ancestorOutputProductIds: string[],
        recursedLevel: number = 1,
    ): I_PROCESS_DATA[] {
        /**
         * Filter 1 level deeper: exclude any process for which
         * any of its inputs can only be made with process variants requiring
         * an input from among "ancestorOutputProductIds" (i.e. infinite loop).
         */
        const forbiddenInputProductIds = [...ancestorOutputProductIds, outputProductId];
        const extraFilteredProcessVariants = filteredProcessVariants.filter(processData => {
            const isValidProcessVariant = Object.keys(processData.inputs).every(inputProcessId => {
                /**
                 * Ensure this input can be made with at least one process variant
                 * which does NOT require an input from among "ancestorOutputProductIds".
                 */
                let inputProcessVariants = processService.getProcessVariantsForOutputProductId(inputProcessId);
                //// DISABLED re: unverified optimization, high performance cost
                // if (inputProcessVariants.length && recursedLevel <= 5) {
                //     recursedLevel++;
                //     inputProcessVariants = this.extraFilterProcessVariantsForPlannedOutputProductId(
                //         inputProcessVariants,
                //         inputProcessId,
                //         forbiddenInputProductIds,
                //         recursedLevel,
                //     );
                // }
                const isValidInput = inputProcessVariants.some(inputProcessData => {
                    return Object.keys(inputProcessData.inputs).every(inputOfInputId => !forbiddenInputProductIds.includes(inputOfInputId));
                });
                return isValidInput;
            });
            return isValidProcessVariant;
        });
        return extraFilteredProcessVariants;
    }

    public getPreferredProcessVariantForOutputProductId(outputProductId: string, filteredProcessVariants?: I_PROCESS_DATA[]): I_PROCESS_DATA {
        // Preferred process = highest throughput
        let maxThroughput = 0;
        if (!filteredProcessVariants) {
            filteredProcessVariants = processService.getProcessVariantsForOutputProductId(outputProductId);
        }
        let preferredProcess = filteredProcessVariants[0];
        filteredProcessVariants.some(process => {
            if (this.isExtractionByProcessData(process)) {
                // Mining process is always preferred => stop parsing other processes
                preferredProcess = process;
                return true;
            }
            const throughput = processService.getThroughputForProcessOutput(outputProductId, process);
            if (throughput > maxThroughput) {
                maxThroughput = throughput;
                preferredProcess = process;
            }
        });
        // return filteredProcessVariants[0]; //// TEST always use the 1st process variant
        return preferredProcess;
    }

    private addProcessIntoGeneratedPlan(process: I_PROCESS_DATA_WITH_PRIMARY_OUTPUT_PRODUCT_ID): void {
        const industryPlan = this.industryPlan as IndustryPlan;
        const addedProcessIds = industryPlan.getAllProcessesInPlan().map(process => process.getId());
        if (addedProcessIds.includes(process.i)) {
            // SKIP process re: already added (e.g. for a different output)
            return;
        }
        if (Object.keys(process.outputs).every(outputProductId => this.availableInputProductIds.includes(outputProductId))) {
            // SKIP process re: reduntant outputs (e.g. already available as outputs from other processes)
            return;
        }
        // Pick the lowest tier whose "available inputs" can support this process
        const lowestSupportingIndustryTier = industryPlan.getIndustryTiers().find(industryTier => {
            if (this.isExtractionByProcessData(process)) {
                // Add extractions at the lowest tier
                return true;
            }
            let availableInputProductIdsForTier = this.getAvailableInputsForIndustryTier(industryTier).map(product => product.getId());
            // Also use any temporary startup products
            availableInputProductIdsForTier = [...availableInputProductIdsForTier, ...this.tempStartupProductIds];
            return Object.keys(process.inputs).every(inputProductId => availableInputProductIdsForTier.includes(inputProductId));
        });
        if (!lowestSupportingIndustryTier) {
            throw Error(`ERROR: No supporting industry tier for process "${process.name}" @ addProcessIntoGeneratedPlan`);
        }
        // Use existing processor for this process, if any, otherwise add a new processor
        let processor: Processor|null = null;
        const processorBuildingId = processorService.getProcessorBuildingIdBySdkProcessorId(process.processorType);
        if (this.shouldReuseProcessorsWhenGeneratingPlan) {
            processor = lowestSupportingIndustryTier.getProcessors().find(processor => processor.getId() === processorBuildingId) || null;
        }
        if (!processor) {
            processor = lowestSupportingIndustryTier.addProcessorById(processorBuildingId);
        }
        // Add the process into that processor
        const addedProcess = processor.addProcessById(process.i) as Process;
        // Set the primary output
        addedProcess.setPrimaryOutputByProductId(process.primaryOutputProductId);
        // Add its outputs into "availableInputProductIds"
        Object.keys(process.outputs).forEach(outputProductId => uniquePushToArray(this.availableInputProductIds, outputProductId));
    }
}

const industryPlanService: IndustryPlanService = IndustryPlanService.getInstance(); // singleton

export {
    IndustryPlanJSON,
    industryPlanService,
}
