import {getItemNameSafe} from './abstract-core.js';
import {createEl} from './dom-core.js';
import {Process} from './process.js';
import {type TYPE_PROCESSOR_BUILDING_IDS, processorService} from './processor-service.js';

class Processor {
    private id: TYPE_PROCESSOR_BUILDING_IDS;
    private processes: Process[] = [];
    private htmlElement: HTMLElement;

    constructor(id: TYPE_PROCESSOR_BUILDING_IDS) {
        this.id = id;
        this.htmlElement = this.makeHtmlElement();
    }

    public getId(): TYPE_PROCESSOR_BUILDING_IDS {
        return this.id;
    }

    public getName(): string {
        return processorService.getBuildingName(this.id);
    }

    public getProcesses(): Process[] {
        return this.processes;
    }

    public getHtmlElement(): HTMLElement {
        return this.htmlElement;
    }

    public getElProcessesList(): HTMLElement {
        // Always "HTMLElement", never "null"
        return this.htmlElement.querySelector('.processes-list') as HTMLElement;
    }

    public addProcessById(processId: number): void {
        const process = new Process(processId);
        if (!process.getData()) {
            // Invalid process / ID
            return;
        }
        this.processes.push(process);
        this.getElProcessesList().append(process.getHtmlElement());
        //// TO DO: if process is EMPTY_LOT => HIDE / REMOVE "Add Process" button re: max 1 construction per lot
    }

    public remove(): void {
        this.htmlElement.parentElement?.removeChild(this.htmlElement);
        //// TO DO: also remove this class instance from the parent "IndustryTier", via "removeProcessor"
    }

    private onClickAddProcessButton(): void {
        console.log(`--- [onClickAddProcessButton]`); //// TEST
    }

    public makeHtmlElement(): HTMLElement {
        const el = createEl('div', null, ['processor']);
        const processorClassName = getItemNameSafe(this.getName()); // e.g. "empty-lot"
        const tooltipText = `In-game lot not yet linked`; //// TEST
        el.classList.add(`-${processorClassName}`);
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
}

export {
    Processor,
}
