import {createEl, fromNow} from '../abstract-core.js';
import {LotData} from '../types.js';
import {OverlayAbstract} from './overlay-abstract';
import {industryPlanService} from '../industry-plan-service.js';
import {Processor} from '../processor.js';
import {processorService} from '../processor-service.js';
import {processService} from '../process-service.js';
import {gameDataService} from '../game-data-service.js';

class OverlayLinkLot extends OverlayAbstract {
    private parentProcessor: Processor;
    private lotData: LotData|null = null;
    private elInputAsteroidId: HTMLInputElement;
    private elInputLotIndex: HTMLInputElement;
    private elCheckButton: HTMLElement;
    private elViewButton: HTMLAnchorElement;
    private elLotDetails: HTMLElement;
    private elBuildingType: HTMLElement;
    private elBuildingName: HTMLElement;
    private elBuildingCrewName: HTMLElement;
    private elRunningProcesses: HTMLElement;
    private elSaveButton: HTMLElement;

    constructor(parentProcessor: Processor) {
        super();

        this.parentProcessor = parentProcessor;
        this.populateElOverlayContent();
    }

    private restrictNumericInput(elInput: HTMLInputElement, minValue: number, maxValue: number): void {
        elInput.value = elInput.value.replace(/[^0-9]/g, '');
        if (elInput.value.length) {
            if (Number(elInput.value) < minValue) {
                elInput.value = minValue.toString(); // MIN asteroid ID
            }
            if (Number(elInput.value) > maxValue) {
                elInput.value = maxValue.toString(); // MAX asteroid ID
            }
        }
    }

    private onChangedValues(): void {
        let allValuesSet = false;
        this.elViewButton.classList.add('hidden');
        this.elViewButton.removeAttribute('href');
        if (this.elInputAsteroidId.value && this.elInputLotIndex.value) {
            allValuesSet = true;
            const asteroidId = Number(this.elInputAsteroidId.value);
            const lotIndex = Number(this.elInputLotIndex.value);
            const lotId = gameDataService.getLotId(asteroidId, lotIndex);
            if (lotId) {
                // Set URL for "View In-Game" button, and make it visible
                const chainId = industryPlanService.getIndustryPlan()?.getChainId();
                const gameSubdomain = chainId === 'SN_SEPOLIA' ? 'game-prerelease' : 'game';
                this.elViewButton.href = `https://${gameSubdomain}.influenceth.io/lot/${lotId}`;
                this.elViewButton.classList.remove('hidden');
            }
        }
        this.elCheckButton.parentElement?.classList.toggle('hidden', !allValuesSet);
        this.elSaveButton.classList.toggle('disabled', !allValuesSet);
    }

    private onInputAsteroidId(): void {
        // Value must be integer between 1 and 250000 (max asteroid ID)
        this.restrictNumericInput(this.elInputAsteroidId, 1, 250000);
        this.onChangedValues();
    }

    private onInputLotIndex(): void {
        // Value must be integer between 1 and 1768484 (max lot ID on Adalia Prime)
        this.restrictNumericInput(this.elInputLotIndex, 1, 1768484);
        this.onChangedValues();
    }

    private onClickRemoveButton(): void {
        if (!confirm('Are you sure you want to unlink this in-game lot?')) {
            return; // Abort action
        }
        this.parentProcessor.setAsteroidIdAndLotIndex(null, null);
        this.parentProcessor.getParentIndustryTier().onProcessorChanged();
        this.remove();
    }

    private async onClickSaveButton(): Promise<void> {
        if (this.elInputAsteroidId.value && this.elInputLotIndex.value) {
            const asteroidId = Number(this.elInputAsteroidId.value);
            const lotIndex = Number(this.elInputLotIndex.value);
            this.parentProcessor.setAsteroidIdAndLotIndex(asteroidId, lotIndex);
            await processorService.updateLocationForProcessor(this.parentProcessor);
        } else {
            this.parentProcessor.setAsteroidIdAndLotIndex(null, null);
        }
        this.parentProcessor.getParentIndustryTier().onProcessorChanged();
        this.remove();
    }

    private async updateLotData(): Promise<void> {
        let isMatchingBuildingType = false;
        let buildingTypeText = '';
        let buildingName = '';
        let buildingCrewName = '';
        let runningProcessesHtml = '';
        if (this.elInputAsteroidId.value && this.elInputLotIndex.value) {
            const asteroidId = Number(this.elInputAsteroidId.value);
            const lotIndex = Number(this.elInputLotIndex.value);
            this.lotData = await industryPlanService.getLotDataByAsteroidIdAndLotIndex(asteroidId, lotIndex);
            if (this.lotData) {
                const buildingType = gameDataService.getBuildingTypeFromLotData(this.lotData);
                isMatchingBuildingType = buildingType === this.parentProcessor.getId();
                if (buildingType) {
                    buildingTypeText = processorService.getBuildingName(buildingType);
                }
                buildingName = gameDataService.getBuildingNameFromLotData(this.lotData) || '';
                buildingCrewName = gameDataService.getBuildingCrewNameFromLotData(this.lotData) || '';
                const runningProcessesData = gameDataService.getRunningProcessesDataFromLotData(this.lotData);
                if (runningProcessesData.length) {
                    runningProcessesHtml = '<div class="processes-list">';
                    runningProcessesHtml += runningProcessesData.map(processData => {
                        const processId = processData.processId;
                        const processName = processService.getProcessDataById(processId).name;
                        const endDate = new Date(processData.finishTime * 1000);
                        const processFinish = fromNow(endDate) || '';
                        return /*html*/ `
                            <div class="process-item">
                                <div class="process-name">${processName}</div>
                                <div class="process-finish">(done ${processFinish})</div>
                            </div>
                        `;
                    }).join('');
                    runningProcessesHtml += '</div>';
                }
            }
        } else {
            this.lotData = null;
        }
        this.elBuildingType.textContent = buildingTypeText;
        this.elBuildingName.textContent = buildingName;
        this.elBuildingCrewName.textContent = buildingCrewName;
        this.elRunningProcesses.innerHTML = runningProcessesHtml;
        this.elBuildingType.classList.toggle('warning', !isMatchingBuildingType);
        this.elLotDetails.classList.toggle('hidden', !this.lotData);
        this.elCheckButton.parentElement?.classList.add('hidden');
    }

    private populateElOverlayContent(): void {
        const processorClassName = this.parentProcessor.getProcessorClassName();
        const asteroidId = this.parentProcessor.getAsteroidId();
        const lotIndex = this.parentProcessor.getLotIndex();
        this.elOverlayContent.innerHTML = /*html*/ `
            <div class="overlay-header">
                <div class="overlay-title">Link In-Game Lot</div>
                <div class="processor ${processorClassName}">
                    <div class="processor-header">
                        <div class="processor-name">${this.parentProcessor.getName()}</div>
                    </div>
                </div>
            </div>
            <div class="overlay-info">
                <div>By linking an in-game lot with a matching building, you can track processes running at that location.</div>
            </div>
            <div class="overlay-form">
                <div class="form-cell">
                    <div>Asteroid ID:</div>
                    <input type="text" name="asteroid-id" value="${asteroidId ? asteroidId : ''}">
                </div>
                <div class="form-cell">
                    <div>Lot Index:</div>
                    <input type="text" name="lot-index" value="${lotIndex ? lotIndex : ''}">
                    </div>
                <div class="form-cell hidden">
                    <div class="cta-button check-button">Check</div>
                </div>
                <div class="form-cell form-cell-max">
                    <a class="cta-button view-button hidden" target="_blank">View In-Game</a>
                </div>
                <div class="form-cell">
                    <div class="cta-button remove-button">Remove</div>
                </div>
            </div>
            <div class="lot-details">
                <div class="building-type"></div>
                <div class="building-name"></div>
                <div class="building-crew-name"></div>
                <div class="running-processes"></div>
            </div>
            <div class="overlay-cta">
                <div class="cta-button save-button">Save</div>
            </div>
        `;
        this.elInputAsteroidId = this.elOverlayContent.querySelector('input[name="asteroid-id"]') as HTMLInputElement;
        this.elInputLotIndex = this.elOverlayContent.querySelector('input[name="lot-index"]') as HTMLInputElement;
        this.elCheckButton = this.elOverlayContent.querySelector('.check-button') as HTMLElement;
        this.elViewButton = this.elOverlayContent.querySelector('.view-button') as HTMLAnchorElement;
        const elRemoveButton = this.elOverlayContent.querySelector('.remove-button') as HTMLElement;
        this.elLotDetails = this.elOverlayContent.querySelector('.lot-details') as HTMLElement;
        this.elBuildingType = this.elLotDetails.querySelector('.building-type') as HTMLElement;
        this.elBuildingName = this.elLotDetails.querySelector('.building-name') as HTMLElement;
        this.elBuildingCrewName = this.elLotDetails.querySelector('.building-crew-name') as HTMLElement;
        this.elRunningProcesses = this.elLotDetails.querySelector('.running-processes') as HTMLElement;
        this.elSaveButton = this.elOverlayContent.querySelector('.save-button') as HTMLElement;
        this.elInputAsteroidId.addEventListener('input', this.onInputAsteroidId.bind(this));
        this.elInputLotIndex.addEventListener('input', this.onInputLotIndex.bind(this));
        this.elCheckButton.addEventListener('click', this.updateLotData.bind(this));
        elRemoveButton.addEventListener('click', this.onClickRemoveButton.bind(this));
        this.elSaveButton.addEventListener('click', this.onClickSaveButton.bind(this));
        elRemoveButton.classList.toggle('hidden', !this.parentProcessor.getHasLocation());
        this.onChangedValues();
        this.updateLotData();
    }

    protected makeElOverlayContent(): HTMLElement {
        const el = createEl('div', null, ['overlay-content-inner', 'overlay-link-lot']);
        // NOT populating this element yet, because it's created in the "super" constructor, before setting the properties of this class
        return el;
    }
}

export {
    OverlayLinkLot,
}
