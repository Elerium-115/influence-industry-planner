import {uniquePushToArray} from './abstract-core.js';
import {createEl} from './dom-core.js';
import {RefiningPenalty} from './refining-penalty.js';
import {industryPlanService} from './industry-plan-service.js';
import {StartupProduct} from './startup-product.js';
import {IndustryTier} from './industry-tier.js';
import {Process} from './process.js';
import {productService} from './product-service.js';
import {OverlayAddStartupProducts} from './overlays/overlay-add-startup-products.js';
import {OverlayGeneratePlanForTargetProducts} from './overlays/overlay-generate-plan-for-product.js';

class IndustryPlan {
    private id: string;
    private title: string;
    private titleSaved: string;
    private updatedTs: number;
    private scientistsInCrew: number;
    private refiningPenalty: RefiningPenalty;
    private startupProducts: StartupProduct[] = [];
    private industryTiers: IndustryTier[] = [];
    private isLoading: boolean = false;
    private isSaved: boolean = false;
    private isPendingOperation: boolean = false;
    private industryPlanHtmlElement: HTMLElement;
    private industryPlanHeaderHtmlElement: HTMLElement;
    private industryPlanMainHtmlElement: HTMLElement;
    private startupProductsHtmlElement: HTMLElement;
    private industryTiersHtmlElement: HTMLElement;

    constructor(
        title: string,
        scientistsInCrew: number = 1,
        id?: string|null,
    ) {
        industryPlanService.setIndustryPlan(this);
        if (id) {
            // Previously saved plan => NOT updating "updatedTs"
            this.id = id;
        } else {
            // Newly created plan
            this.id = crypto.randomUUID();
            this.updatedTs = new Date().getTime();
        }
        this.title = title;
        this.titleSaved = title;
        // Set "scientistsInCrew" WITHOUT updating the qtys re: industry plan NOT yet populated
        this.setScientistsInCrew(scientistsInCrew, false);
        this.refiningPenalty = new RefiningPenalty(scientistsInCrew, this);
        // Always "HTMLElement", never "null"
        this.industryPlanHtmlElement = document.getElementById('industry-plan') as HTMLElement;
        this.industryPlanHeaderHtmlElement = document.getElementById('industry-plan-header') as HTMLElement;
        this.industryPlanMainHtmlElement = document.getElementById('industry-plan-main') as HTMLElement;
        // Reset HTML elements, in case of previously loaded plan
        this.industryPlanHeaderHtmlElement.textContent = '';
        this.industryPlanMainHtmlElement.textContent = '';
        this.markHasSecondaryOutputs(); // required when creating a new plan, while another plan with secondary outputs is loaded
        this.populateIndustryPlanHeader();
        this.populateIndustryPlanMain();
    }

    public getId(): string {
        return this.id;
    }

    public getTitle(): string {
        return this.title;
    }

    public getUpdatedTs(): number {
        return this.updatedTs;
    }

    public getScientistsInCrew(): number {
        return this.scientistsInCrew;
    }

    public setScientistsInCrew(scientistsInCrew: number, shouldUpdateQtys: boolean = true): void {
        this.scientistsInCrew = scientistsInCrew;
        if (shouldUpdateQtys) {
            // Update qtys for secondary outputs, if any
            this.getAllProcessesInPlan().forEach(process => {
                if (process.getOutputs().length <= 1) {
                    // NO secondary outputs
                    return;
                }
                // Force-update the primary output for this process, to update the qtys + flash it
                process.setPrimaryOutput(process.getPrimaryOutput(), true);
            });
        }
    }

    public getStartupProducts(): StartupProduct[] {
        return this.startupProducts;
    }

    public getIndustryTiers(): IndustryTier[] {
        return this.industryTiers;
    }

    public getIndustryTierLast(): IndustryTier {
        return this.industryTiers.slice(-1)[0];
    }

    /**
     * Get each instance of each "Process" in this industry plan,
     * including multiple instances for the same process ID.
     */
    public getAllProcessesInPlan(): Process[] {
        const processes: Process[] = [];
        this.industryTiers.forEach(industryTier => {
            industryTier.getProcessors().forEach(processor => {
                processes.push(...processor.getProcesses());
            });
        });
        return processes;
    }

    //// TO DO: cleanup if still not used, after some time...
    // /**
    //  * Get the DISTINCT product IDs of all outputs in this industry plan
    //  */
    // private getAllOutputProductIdsInPlan(): string[] {
    //     const outputProductIds: string[] = [];
    //     this.getAllProcessesInPlan().forEach(process => {
    //         process.getOutputs().forEach(output => {
    //             uniquePushToArray(outputProductIds, output.getId());
    //         });
    //     });
    //     return outputProductIds;
    // }

    private getElStartupProdutsList(): HTMLElement {
        // Always "HTMLElement", never "null"
        return this.startupProductsHtmlElement.querySelector('.startup-products-list') as HTMLElement;
    }

    public setIsLoading(isLoading: boolean): void {
        this.isLoading = isLoading;
    }

    public getIsSaved(): boolean {
        return this.isSaved;
    }

    public setSavedStatusAndIcon(isSaved: boolean): void {
        this.isSaved = isSaved;
        this.industryPlanHeaderHtmlElement.querySelector('.save-icon')?.classList.toggle('saved', isSaved);
    }

    public setIsPendingOperation(isPendingOperation: boolean): void {
        this.isPendingOperation = isPendingOperation;
        this.industryPlanHtmlElement.classList.toggle('is-pending-operation', isPendingOperation);
    }

    public markHasSecondaryOutputs(): void {
        // Show "Scientists in Crew" only if the industry plan contains processes with secondary outputs
        const hasSecondaryOutputs = this.getAllProcessesInPlan().some(process => process.getOutputs().length >= 2);
        this.industryPlanHeaderHtmlElement.classList.toggle('has-secondary-outputs', hasSecondaryOutputs);
    }

    public addStartupProductById(id: string, shouldSortAndUpdate: boolean = true): void {
        if (this.startupProducts.find(startupProduct => startupProduct.getId() === id)) {
            // Startup product already added
            return;
        }
        const startupProduct = new StartupProduct(id, this);
        if (!startupProduct.getId()) {
            // Invalid startup product / ID
            return;
        }
        this.startupProducts.push(startupProduct);
        if (shouldSortAndUpdate) {
            this.onUpdatedStartupProducts();
        }
    };

    public batchAddStartupProductsByIds(ids: string[]): void {
        ids.forEach(id => this.addStartupProductById(id, false));
        this.onUpdatedStartupProducts();
    }

    public onGeneratePlanForTargetProductIds(targetProductIds: string[]): void {
        // Async execution, to show the "pending" overlay during that time
        this.setIsPendingOperation(true);
        setTimeout(async () => {
            await industryPlanService.generatePlanForTargetProductIds(targetProductIds);
            this.setIsPendingOperation(false);
        });
    }

    private addIndustryTier(): void {
        const industryTierTitle = `Industry Tier #${this.industryTiers.length + 1}`;
        const industryTier = new IndustryTier(industryTierTitle, this);
        this.industryTiers.push(industryTier);
        // Add new industry tier into the DOM
        this.industryTiersHtmlElement.append(industryTier.getHtmlElement());
    }

    public onStartupProductRemoved(startupProductRemoved: StartupProduct): void {
        this.startupProducts = this.startupProducts.filter(startupProduct => startupProduct !== startupProductRemoved);
        this.onIndustryPlanChanged();
    }

    public onUpdatedStartupProducts(): void {
        // Sort startup products alphabetically
        productService.sortProductsByName(this.startupProducts);
        // Update startup products in the DOM
        const elStartupProdutsList = this.getElStartupProdutsList();
        // -- Remove old startup products from the DOM
        elStartupProdutsList.textContent = '';
        // -- Add new startup products into the DOM
        this.startupProducts.forEach(startupProduct => {
            elStartupProdutsList.append(startupProduct.getHtmlElement());
        });
        this.onIndustryPlanChanged();
    }

    private onClickAddStartupProductsButton(): void {
        new OverlayAddStartupProducts(this);
    }

    public onIndustryTierPopulated(industryTierPopulated: IndustryTier): void {
        if (industryTierPopulated === this.getIndustryTierLast()) {
            // Processor added to last industry tier => add new (empty) industry tier
            this.addIndustryTier();
        }
    }

    public onIndustryTierRemoved(industryTierRemoved: IndustryTier): void {
        this.industryTiers = this.industryTiers.filter(industryTier => industryTier !== industryTierRemoved);
        // Update the title of all remaining industry tiers
        this.industryTiers.forEach((industryTier: IndustryTier, idx: number) => {
            industryTier.setTitle(`Industry Tier #${idx + 1}`);
        });
    }

    private onClickDuplicatePlan(): void {
        console.log(`--- [onClickDuplicatePlan]`); //// TEST
    }

    private onClickSharePlan(): void {
        console.log(`--- [onClickSharePlan]`); //// TEST
    }

    private onClickRemovePlan(): void {
        if (!confirm('Are you sure you want to permanently remove this industry plan?')) {
            return; // Abort action
        }
        // Reset HTML elements
        this.industryPlanHeaderHtmlElement.textContent = '';
        this.industryPlanMainHtmlElement.textContent = '';
        industryPlanService.onRemoveIndustryPlan();
    }

    private onInputTitle(): void {
        const elTitleWrapper = this.industryPlanHeaderHtmlElement.querySelector('.title-wrapper') as HTMLElement;
        const elTitleHidden = elTitleWrapper.querySelector('.title-hidden') as HTMLElement;
        const elTitleInput = elTitleWrapper.querySelector('.title-input') as HTMLInputElement;
        /**
         * Resize the title-input, to match the actual width of the title - plus an offset
         * to avoid overflow glitch, when the title is resized BEFORE the fonts are loaded.
         */
        const offset = 8; // 8px
        elTitleHidden.textContent = elTitleInput.value;
        elTitleInput.style.width = (elTitleHidden.offsetWidth + offset) + 'px';
    }

    private onKeydownTitle(event: KeyboardEvent): void {
        const elTitleInput = event.target as HTMLInputElement;
        // Pressing "Enter" while this input is focused => trigger its "blur" handler
        if (event.key === 'Enter' && elTitleInput === document.activeElement) {
            elTitleInput.blur();
        }
    }

    private onBlurTitle(event: InputEvent): void {
        const elTitleInput = event.target as HTMLInputElement;
        const newTitle = elTitleInput.value.trim();
        const isReservedTitle = (newTitle !== this.title)
            && (newTitle !== this.titleSaved)
            && industryPlanService.isReservedPlanTitle(newTitle);
        // Ensure title not empty, and not used by another saved plan
        if (!newTitle || isReservedTitle) {
            // Revert to previously set title
            elTitleInput.value = this.title;
            this.onInputTitle();
            if (isReservedTitle) {
                alert('Title already used by another one of your saved plans. Try a different title.');
            }
            return;
        }
        // Ensure trimmed title
        elTitleInput.value = newTitle;
        this.onInputTitle();
        if (this.title !== newTitle) {
            this.title = newTitle;
            this.onIndustryPlanChanged(false);
        }
    }

    private onClickSaveIcon(): void {
        this.updatedTs = new Date().getTime();
        this.titleSaved = this.title;
        industryPlanService.saveIndustryPlanJSON();
        this.setSavedStatusAndIcon(true);
    }

    private onClickGeneratePlan(): void {
        new OverlayGeneratePlanForTargetProducts(this);
    }

    public async onIndustryPlanChanged(isFunctionalChange: boolean = true): Promise<void> {
        if (this.isLoading) {
            // Bypass this while the industry plan is being loaded
            return;
        }
        this.setSavedStatusAndIcon(false);
        if (isFunctionalChange) {
            this.markHasSecondaryOutputs();
            //// TO DO: highlight processes whose inputs are no longer available (e.g. if removed Startup Products / Processors / Processes)
            //// -- mark them as "disabled" + exclude their outputs from "getAvailableInputsForIndustryTier"
        }
    }

    private populateIndustryPlanHeader(): void {
        // Add plan-menu
        this.industryPlanHeaderHtmlElement.append(this.makePlanMenuHtmlElement());
        // Add editable title
        const elTitleWrapper = createEl('div', null, ['title-wrapper']);
        elTitleWrapper.dataset.tooltipPosition = 'bottom-left';
        elTitleWrapper.dataset.tooltip = 'Click to edit this title';
        // -- Hidden plan title, used for measuring the width of the editable plan title
        const elTitleHidden = createEl('div', null, ['title-hidden']);
        elTitleWrapper.append(elTitleHidden);
        // -- Editable plan title
        const elTitleInput = createEl('input', null, ['title-input']) as HTMLInputElement;
        elTitleInput.type = 'text';
        elTitleInput.value = this.title;
        elTitleInput.addEventListener('input', this.onInputTitle.bind(this));
        elTitleInput.addEventListener('keydown', this.onKeydownTitle.bind(this));
        elTitleInput.addEventListener('blur', this.onBlurTitle.bind(this));
        elTitleWrapper.append(elTitleInput);
        this.industryPlanHeaderHtmlElement.append(elTitleWrapper);
        // Trigger this handler only after the above elements have been added into the DOM
        this.onInputTitle();
        // Add save-icon
        const elSaveIcon = createEl('div', null, ['save-icon']);
        elSaveIcon.dataset.tooltipPosition = 'bottom-left';
        elSaveIcon.dataset.tooltip = 'Save this industry plan into local-storage';
        elSaveIcon.addEventListener('click', this.onClickSaveIcon.bind(this));
        this.industryPlanHeaderHtmlElement.append(elSaveIcon);
        // Add "Scientists in Crew" (a.k.a. refining penalty)
        this.industryPlanHeaderHtmlElement.append(this.refiningPenalty.getHtmlElement());
        // Add "Generate Plan for Target Products"
        const elGeneratePlan = createEl('div', null, ['generate-plan-for-target-products']);
        elGeneratePlan.innerHTML = '<div class="generate-plan-button"></div>';
        elGeneratePlan.dataset.tooltipPosition = 'bottom-left';
        elGeneratePlan.dataset.tooltip = 'Generate the entire industry plan required to make any target products';
        elGeneratePlan.addEventListener('click', this.onClickGeneratePlan.bind(this));
        this.industryPlanHeaderHtmlElement.append(elGeneratePlan);
    }

    private populateIndustryPlanMain(): void {
        // Empty old industry plan in the DOM
        this.industryPlanMainHtmlElement.textContent = '';
        /**
         * Add wrappers for main components into the DOM:
         * - startup products (initially empty)
         * - industry tiers (initially empty)
         */
        this.startupProductsHtmlElement = this.makeStartupProductsHtmlElement();
        this.industryTiersHtmlElement = this.makeIndustryTiersHtmlElement();
        this.industryPlanMainHtmlElement.append(this.startupProductsHtmlElement);
        this.industryPlanMainHtmlElement.append(this.industryTiersHtmlElement);
        // Add initial industry tier
        this.addIndustryTier();
    }

    private makePlanMenuHtmlElement(): HTMLElement {
        const el = createEl('div', 'plan-menu');
        el.innerHTML = /*html*/ `
            <div class="plan-menu-inner">
                <ul>
                    <li class='-duplicate'>Duplicate</li>
                    <li class='-share'>Share</li>
                    <li class='-remove'>Remove</li>
                </ul>
            </div>
        `;
        const elDuplicatePlane = el.querySelector('.-duplicate') as HTMLElement;
        const elSharePlan = el.querySelector('.-share') as HTMLElement;
        const elRemovePlan = el.querySelector('.-remove') as HTMLElement;
        elDuplicatePlane.addEventListener('click', this.onClickDuplicatePlan.bind(this));
        elSharePlan.addEventListener('click', this.onClickSharePlan.bind(this));
        elRemovePlan.addEventListener('click', this.onClickRemovePlan.bind(this));
        return el;
    }

    private makeStartupProductsHtmlElement(): HTMLElement {
        const el = createEl('div', 'startup-products');
        el.innerHTML = /*html*/ `
            <div class="startup-products-title"></div>
            <div class="startup-products-list"></div>
            <div class="add-startup-products-button"></div>
        `;
        el.querySelector('.add-startup-products-button')?.addEventListener('click', this.onClickAddStartupProductsButton.bind(this));
        return el;
    }

    private makeIndustryTiersHtmlElement(): HTMLElement {
        const el = createEl('div', 'industry-tiers');
        return el;
    }
}

export {
    IndustryPlan,
}
