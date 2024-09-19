import {getItemNameSafe} from './abstract-core.js';
import {createEl} from './dom-core.js';
import {
    EVENT_PROCESSOR,
    type TYPE_PROCESSOR_BUILDING_IDS,
    processorService,
} from './processor-service.js';
import {Process} from './process.js';
import {EVENT_PROCESS, processService} from './process-service.js';

class Processor {
    private id: TYPE_PROCESSOR_BUILDING_IDS;
    private processes: Process[] = [];
    private htmlElement: HTMLElement;

    constructor(id: TYPE_PROCESSOR_BUILDING_IDS) {
        this.id = id;
        this.htmlElement = this.makeHtmlElement();
        // Listen for events
        processService.addEventListener(
            EVENT_PROCESS.PROCESS_REMOVED,
            this.onProcessRemoved.bind(this)
        );
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
        const process = new Process(processId);
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

    private onProcessRemoved(event: CustomEvent): void {
        /**
         * NOTE: This is triggered in ALL processors,
         * when a process from ANY processor is removed.
         */
        const processRemoved = event.detail;
        if (!this.processes.includes(processRemoved)) {
            // Event irrelevant for this processor
            return;
        }
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
        processorService.emit(EVENT_PROCESSOR.PROCESSOR_REMOVED, this);
    }
}

export {
    Processor,
}
