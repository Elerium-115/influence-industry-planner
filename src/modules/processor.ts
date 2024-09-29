import {getItemNameSafe} from './abstract-core.js';
import {createEl} from './dom-core.js';
import {IndustryTier} from './industry-tier.js';
import {
    PROCESSOR_BUILDING_IDS,
    type TYPE_PROCESSOR_BUILDING_IDS,
    processorService,
} from './processor-service.js';
import {Process} from './process.js';
import {OverlayAddProcess} from './overlays/overlay-add-process.js';
import {OverlayAddExtraction} from './overlays/overlay-add-extraction.js';

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

    public getId(): TYPE_PROCESSOR_BUILDING_IDS {
        return this.id;
    }

    public getProcesses(): Process[] {
        return this.processes;
    }

    public getName(): string {
        return processorService.getBuildingName(this.id);
    }

    public getProcessorClassName(): string {
        return `-${getItemNameSafe(this.getName())}`; // e.g. "-empty-lot"
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
        if (this.id === PROCESSOR_BUILDING_IDS.EMPTY_LOT) {
            // Hide "Add Construction" button re: max 1 construction per lot
            this.htmlElement.classList.add('hide-add-process');
        }
    }

    private onClickAddProcessButton(): void {
        if (this.id === PROCESSOR_BUILDING_IDS.EXTRACTOR) {
            new OverlayAddExtraction(this);
        } else {
            new OverlayAddProcess(this, this.parentIndustryTier);
        }
    }

    public onProcessRemoved(processRemoved: Process): void {
        this.processes = this.processes.filter(process => process !== processRemoved);
        if (this.id === PROCESSOR_BUILDING_IDS.EMPTY_LOT && !this.processes.length) {
            // Show "Add Construction" button
            this.htmlElement.classList.remove('hide-add-process');
        }
    }

    private makeHtmlElement(): HTMLElement {
        const el = createEl('div', null, ['processor', this.getProcessorClassName()]);
        const tooltipText = `In-game lot not yet linked`;
        el.innerHTML = /*html*/ `
            <div class="processor-header">
                <div class="processor-name">${this.getName()}</div>
                <div class="processor-info" data-tooltip-position="top-right" data-tooltip="${tooltipText}"></div>
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
