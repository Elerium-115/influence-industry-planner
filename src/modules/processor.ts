import {getItemNameSafe} from './abstract-core.js';
import {createEl} from './dom-core.js';
import {IndustryTier} from './industry-tier.js';
import {leaderLineService} from './leader-line-service.js';
import {
    PROCESSOR_BUILDING_IDS,
    type TYPE_PROCESSOR_BUILDING_IDS,
    processorService,
} from './processor-service.js';
import {Process} from './process.js';
import {gameDataService} from './game-data-service.js';
import {apiService} from './api-service.js';
import {OverlayAddProcess} from './overlays/overlay-add-process.js';
import {OverlayAddExtraction} from './overlays/overlay-add-extraction.js';

class Processor {
    private id: TYPE_PROCESSOR_BUILDING_IDS;
    private parentIndustryTier: IndustryTier;
    private processes: Process[] = [];
    private asteroidId: number|null = null;
    private lotIndex: number|null = null;
    private hasLocation: boolean = false;
    private isValidLocation: boolean = true; // may become FALSE only if "hasLocation" TRUE
    private htmlElement: HTMLElement;
    private elProcessorLocation: HTMLElement;

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

    public getParentIndustryTier(): IndustryTier {
        return this.parentIndustryTier;
    }

    public getAsteroidId(): number|null {
        return this.asteroidId;
    }

    public setAsteroidId(asteroidId: number|null): void {
        this.asteroidId = asteroidId;
        this.updateElProcessorLocation();
    }

    public getLotIndex(): number|null {
        return this.lotIndex;
    }

    public setLotIndex(lotIndex: number|null): void {
        this.lotIndex = lotIndex;
        this.updateElProcessorLocation();
    }

    public getIsValidLocation(): boolean {
        return this.isValidLocation;
    }

    public getHtmlElement(): HTMLElement {
        return this.htmlElement;
    }

    private getElProcessesList(): HTMLElement {
        return this.htmlElement.querySelector('.processes-list') as HTMLElement;
    }

    private async updateElProcessorLocation(): Promise<void> {
        let processorLocationHtml = '';
        if (this.asteroidId && this.lotIndex) {
            this.hasLocation = true;
            const asteroidName = gameDataService.getAsteroidName(this.asteroidId);
            const lotText = Intl.NumberFormat().format(this.lotIndex);
            processorLocationHtml = /*html*/ `
                <div class="location-asteroid">${asteroidName}</div>
                <div class="location-lot">${lotText}</div>
            `;
            // Update "isValidLocation" based on in-game building-type matching this processor ID
            const chainId = this.parentIndustryTier.getParentIndustryPlan().getChainId();
            const lotId = gameDataService.getLotId(this.asteroidId, this.lotIndex) as number;
            //// TO DO: use cached lot data for this "chainId" + "lotId" (if any)
            try {
                const lotDataByIdResponse = await apiService.fetchLotsData(chainId, [lotId]);
                // console.log(`--- [updateElProcessorLocation] lotDataByIdResponse:`, lotDataByIdResponse); //// TEST
                const lotDataById = lotDataByIdResponse.data;
                if (lotDataById) {
                    const lotData = lotDataById[lotId];
                    const buildingType = gameDataService.getBuildingTypeFromLotData(lotData);
                    // console.log(`--- buildingType = ${buildingType}, this id = ${this.id}`); //// TEST
                    this.isValidLocation = buildingType === this.id;
                }
            } catch (error: any) {
                // console.log(`--- [updateElProcessorLocation] ERROR:`, error); //// TEST
                this.isValidLocation = false;
            }
        } else {
            this.hasLocation = false;
            this.isValidLocation = true;
        }
        this.elProcessorLocation.innerHTML = processorLocationHtml;
        if (this.isValidLocation) {
            delete this.elProcessorLocation.dataset.tooltip;
        } else {
            this.elProcessorLocation.dataset.tooltip = 'Incorrect building for this in-game lot';
        }
        this.htmlElement.classList.toggle('has-location', this.hasLocation);
        this.htmlElement.classList.toggle('invalid-location', !this.isValidLocation);
    }

    public addProcessById(processId: number): Process|null {
        const process = new Process(processId, this);
        if (!process.getData()) {
            // Invalid process / ID
            return null;
        }
        this.processes.push(process);
        // Add new process into the DOM
        this.getElProcessesList().append(process.getHtmlElement());
        if (this.id === PROCESSOR_BUILDING_IDS.EMPTY_LOT) {
            // Hide "Add Construction" button re: max 1 construction per lot
            this.htmlElement.classList.add('hide-add-process');
        }
        this.parentIndustryTier.onProcessorChanged();
        return process;
    }

    private onClickRemoveProcessor(): void {
        if (!confirm('Are you sure you want to remove this building and all its processes?')) {
            return; // Abort action
        }
        this.remove();
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
        this.parentIndustryTier.onProcessorChanged();
    }

    public onProcessChanged(): void {
        this.parentIndustryTier.onProcessorChanged();
    }

    private makeHtmlElement(): HTMLElement {
        const el = createEl('div', null, ['processor', this.getProcessorClassName()]);
        const tooltipText = `Link in-game lot`;
        el.innerHTML = /*html*/ `
            <div class="processor-location"></div>
            <div class="processor-header">
                <div class="processor-name">${this.getName()}</div>
                <div class="processor-info" data-tooltip-position="top-right" data-tooltip="${tooltipText}"></div>
                <div class="remove-processor"></div>
            </div>
            <div class="processes-list"></div>
            <div class="add-process-button"></div>
        `;
        el.querySelector('.remove-processor')?.addEventListener('click', this.onClickRemoveProcessor.bind(this));
        el.querySelector('.add-process-button')?.addEventListener('click', this.onClickAddProcessButton.bind(this));
        this.elProcessorLocation = el.querySelector('.processor-location') as HTMLElement;
        this.elProcessorLocation.dataset.tooltipPosition = 'top-right';
        return el;
    }

    public remove(): void {
        leaderLineService.removeLinesForProcessor(this);
        this.htmlElement.parentElement?.removeChild(this.htmlElement);
        this.parentIndustryTier.onProcessorRemoved(this);
    }
}

export {
    Processor,
}
