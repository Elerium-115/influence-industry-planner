import {cache} from './cache.js';
import {LotData} from './types.js';
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
import {OverlayLinkLot} from './overlays/overlay-link-lot.js';
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

    public getLotIndex(): number|null {
        return this.lotIndex;
    }

    public getHasLocation(): boolean {
        return this.hasLocation;
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

    public setAsteroidIdAndLotIndex(
        asteroidId: number|null,
        lotIndex: number|null,
        shouldUpdateLocation: boolean = true,
    ): void {
        this.asteroidId = asteroidId;
        this.lotIndex = lotIndex;
        if (shouldUpdateLocation) {
            this.updateLocation();
        }
    }

    public updateLocation(): void {
        let processorLocationHtml = '';
        let lotData: LotData|null = null;
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
            // Use cached lot data, if any (even if NOT fresh)
            lotData = cache.getData().lotsDataByChainAndId[chainId][lotId];
            const buildingType = gameDataService.getBuildingTypeFromLotData(lotData);
            this.isValidLocation = buildingType === this.id;
        } else {
            this.hasLocation = false;
            this.isValidLocation = true;
        }
        this.elProcessorLocation.innerHTML = processorLocationHtml;
        if (this.isValidLocation) {
            this.elProcessorLocation.dataset.tooltip = 'Matching building';
            if (lotData) {
                const buildingName = gameDataService.getBuildingNameFromLotData(lotData);
                if (buildingName) {
                    this.elProcessorLocation.dataset.tooltip = `Matching building: ${buildingName}`;
                }
            }
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

    private onClickLinkLot(): void {
        new OverlayLinkLot(this);
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
                <div class="link-lot" data-tooltip-position="top-right" data-tooltip="${tooltipText}"></div>
                <div class="remove-processor"></div>
            </div>
            <div class="processes-list"></div>
            <div class="add-process-button"></div>
        `;
        el.querySelector('.link-lot')?.addEventListener('click', this.onClickLinkLot.bind(this));
        el.querySelector('.remove-processor')?.addEventListener('click', this.onClickRemoveProcessor.bind(this));
        el.querySelector('.add-process-button')?.addEventListener('click', this.onClickAddProcessButton.bind(this));
        this.elProcessorLocation = el.querySelector('.processor-location') as HTMLElement;
        this.elProcessorLocation.dataset.tooltipPosition = 'top-right';
        this.elProcessorLocation.addEventListener('click', this.onClickLinkLot.bind(this));
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
