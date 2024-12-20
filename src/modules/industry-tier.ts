import {createEl, uniquePushToArray} from './abstract-core.js';
import {IndustryPlan} from './industry-plan.js';
import {Processor} from './processor.js';
import {type TYPE_PROCESSOR_BUILDING_IDS} from './processor-service.js';
import {AddProcessorPanel} from './add-processor-panel.js';
import {Process} from './process.js';
import {OverlayAddOutputProduct} from './overlays/overlay-add-output-product.js';

class IndustryTier {
    private id: number;
    private title: string;
    private parentIndustryPlan: IndustryPlan;
    private processors: Processor[] = [];
    private addProcessorPanel: AddProcessorPanel;
    private htmlElement: HTMLElement;

    constructor(id: number, parentIndustryPlan: IndustryPlan) {
        this.id = id;
        this.title = `Industry Tier #${id}`;
        this.parentIndustryPlan = parentIndustryPlan;
        this.htmlElement = this.makeHtmlElement();
    }

    public getId(): number {
        return this.id;
    }

    public getTitle(): string {
        return this.title;
    }

    public getParentIndustryPlan(): IndustryPlan {
        return this.parentIndustryPlan;
    }

    public getProcessors(): Processor[] {
        return this.processors;
    }

    public getProcessesFromTier(): Process[] {
        let processes: Process[] = [];
        this.processors.forEach(processor => processes = [...processes, ...processor.getProcesses()]);
        return processes;
    }

    public getOutputProductIdsFromTier(): string[] {
        // Get the product IDs of all outputs produced at this industry tier
        const outputProductIds: string[] = [];
        this.processors.forEach(processor => {
            processor.getProcesses().forEach(process => {
                process.getOutputs().forEach(output => {
                    uniquePushToArray(outputProductIds, output.getId());
                });
            });
        });
        return outputProductIds;
    }

    public getHtmlElement(): HTMLElement {
        return this.htmlElement;
    }

    private getElProcessorsList(): HTMLElement {
        return this.htmlElement.querySelector('.processors-list') as HTMLElement;
    }

    public setTitle(title: string): void {
        this.title = title;
        const elTitle = this.htmlElement.querySelector('.industry-tier-title') as HTMLElement;
        elTitle.dataset.title = title;
    }

    public addProcessorById(processorId: TYPE_PROCESSOR_BUILDING_IDS): Processor {
        const processor = new Processor(processorId, this);
        this.processors.push(processor);
        // Add new processor into the DOM
        this.getElProcessorsList().append(processor.getHtmlElement());
        if (this.processors.length === 1) {
            // First processor added => signal to parent industry plan
            this.parentIndustryPlan.onIndustryTierPopulated(this);
        }
        this.parentIndustryPlan.onIndustryPlanChanged();
        return processor;
    }

    public onProcessorRemoved(processorRemoved: Processor): void {
        this.processors = this.processors.filter(processor => processor !== processorRemoved);
        if (!this.processors.length) {
            // All processors removed => remove this industry tier
            this.remove();
        }
        this.parentIndustryPlan.onIndustryPlanChanged();
    }

    public onProcessorChanged(): void {
        this.parentIndustryPlan.onIndustryPlanChanged();
    }

    private onClickAddOutputProductButton(): void {
        new OverlayAddOutputProduct(this);
    }

    private makeHtmlElement(): HTMLElement {
        const el = createEl('div', null, ['industry-tier']);
        el.innerHTML = /*html*/ `
            <div class="industry-tier-title" data-title="${this.title}"></div>
            <div class="processors-list"></div>
            <div class="add-output-product-button"></div>
        `;
        el.querySelector('.add-output-product-button')?.addEventListener('click', this.onClickAddOutputProductButton.bind(this));
        // Inject add-processor panel
        this.addProcessorPanel = new AddProcessorPanel(this);
        el.append(this.addProcessorPanel.getHtmlElement());
        return el;
    }

    private remove(): void {
        this.htmlElement.parentElement?.removeChild(this.htmlElement);
        this.parentIndustryPlan.onIndustryTierRemoved(this);
    }
}

export {
    IndustryTier,
}
