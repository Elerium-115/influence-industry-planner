import {getItemNameSafe} from './abstract-core.js';
import {createEl} from './dom-core.js';
import {IndustryTier} from './industry-tier.js';
import {type TYPE_PROCESSOR_BUILDING_IDS, processorService} from './processor-service.js';
import {Process} from './process.js';

class Processor {
    private id: TYPE_PROCESSOR_BUILDING_IDS;
    private parentIndustryTier: IndustryTier;
    private processes: Process[] = [];
    private htmlElement: HTMLElement;

    constructor(id: TYPE_PROCESSOR_BUILDING_IDS, parentIndustryTier: IndustryTier) {
        this.id = id;
        this.parentIndustryTier = parentIndustryTier;
        this.htmlElement = this.makeHtmlElement();
    }

    private getName(): string {
        return processorService.getBuildingName(this.id);
    }

    public getHtmlElement(): HTMLElement {
        return this.htmlElement;
    }

    private getElProcessesList(): HTMLElement {
        // Always "HTMLElement", never "null"
        return this.htmlElement.querySelector('.processes-list') as HTMLElement;
    }

    public addProcessById(processId: number): void {
        const process = new Process(processId, this);
        if (!process.getData()) {
            // Invalid process / ID
            return;
        }
        this.processes.push(process);
        // Add new process into the DOM
        this.getElProcessesList().append(process.getHtmlElement());
        //// TO DO: if process is EMPTY_LOT => HIDE / REMOVE "Add Process" button re: max 1 construction per lot
    }

    private onClickAddProcessButton(): void {
        console.log(`--- [onClickAddProcessButton]`); //// TEST
    }

    public onProcessRemoved(processRemoved: Process): void {
        this.processes = this.processes.filter(process => process !== processRemoved);
    }

    private makeHtmlElement(): HTMLElement {
        const processorClassName = `-${getItemNameSafe(this.getName())}`; // e.g. "-empty-lot"
        const el = createEl('div', null, ['processor', processorClassName]);
        const tooltipText = `In-game lot not yet linked`; //// TEST
        el.innerHTML = /*html*/ `
            <div class="processor-header">
                <div class="processor-name">${this.getName()}</div>
                <div class="processor-info" data-tooltip="${tooltipText}"></div>
                <div class="remove-processor"></div>
            </div>
            <div class="processes-list"></div>
            <div class="add-process-button"></div>
        `;
        el.querySelector('.remove-processor')?.addEventListener('click', this.remove.bind(this));
        el.querySelector('.add-process-button')?.addEventListener('click', this.onClickAddProcessButton.bind(this));
        return el;
    }

    private remove(): void {
        this.htmlElement.parentElement?.removeChild(this.htmlElement);
        this.parentIndustryTier.onProcessorRemoved(this);
    }
}

export {
    Processor,
}
