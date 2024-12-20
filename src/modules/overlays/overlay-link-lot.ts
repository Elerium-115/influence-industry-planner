import {
    createEl,
    fromNow,
    uniquePushToArray,
} from '../abstract-core.js';
import {cache} from '../cache.js';
import {
    BuildingData,
    ChainId,
    LotData,
} from '../types.js';
import {OverlayAbstract} from './overlay-abstract';
import {industryPlanService} from '../industry-plan-service.js';
import {Processor} from '../processor.js';
import {processorService} from '../processor-service.js';
import {processService} from '../process-service.js';
import {gameDataService} from '../game-data-service.js';
import {starknetService} from '../starknet-service.js';
import {apiService} from '../api-service.js';

class OverlayLinkLot extends OverlayAbstract {
    private parentProcessor: Processor;
    private lotData: LotData|null = null;
    private chainId: ChainId;
    private elControlledBuildings: HTMLElement;
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
        this.chainId = parentProcessor.getParentIndustryTier().getParentIndustryPlan().getChainId();
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
                const gameSubdomain = this.chainId === 'SN_SEPOLIA' ? 'game-prerelease' : 'game';
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
                buildingTypeText = processorService.getBuildingName(buildingType);
                buildingName = gameDataService.getBuildingNameFromLotData(this.lotData);
                buildingCrewName = gameDataService.getBuildingCrewNameFromLotData(this.lotData);
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

    private selectBuildingLot(lotId: string): void {
        const lotPosition = gameDataService.getAsteroidIdAndLotIndex(Number(lotId));
        if (!lotPosition) {
            return;
        }
        const {asteroidId, lotIndex} = lotPosition;
        this.elInputAsteroidId.value = asteroidId.toString();
        this.elInputLotIndex.value = lotIndex.toString();
        this.onClickSaveButton();
    }

    private onChangeFilterByAsteroidId(event: InputEvent): void {
        const elInput = event.target as HTMLInputElement;
        this.elControlledBuildings.querySelectorAll(`.list-item[data-asteroid-id="${elInput.value}"]`).forEach(elListItem => {
            elListItem.classList.toggle('hidden', !elInput.checked);
        });
    }

    /**
     * This will be populated only if the user is authed,
     * and if they control at least 1 matching building.
     */
    private async populateControlledBuildings(): Promise<void> {
        const connectedChainId = starknetService.getChainId();
        if (!starknetService.getIsAuthed() || !connectedChainId) {
            return;
        }
        if (connectedChainId !== this.chainId) {
            // Chain ID not matching between industry plan and connected wallet
            const planChainText = starknetService.getChainText(this.chainId);
            const walletChainText = starknetService.getChainText(connectedChainId);
            this.elControlledBuildings.innerHTML = /*html*/ `
                <div class="chain-warning">
                    <div>
                        <div>Buildings controlled by you in-game are not shown, due to a Starknet chain mismatch:</div>
                        <ul>
                            <li>The current industry plan is for ${planChainText}.</li>
                            <li>But your connected wallet is on ${walletChainText}.</li>
                        </ul>
                        <div>
                            You can either connect a wallet on ${planChainText}, or change the industry plan's chain,<br>
                            using the "${planChainText}" / "${walletChainText}" toggle (look for it next to the plan's title).
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        const address = starknetService.getAddress();
        if (!cache.isFreshCacheBuildingsDataControlledByChainAndAddress(this.chainId, address)) {
            // Fetch data from API re: address without a FRESH cache
            try {
                const apiResponse = await apiService.fetchBuildingsDataControlled(starknetService.getToken());
                if (apiResponse.error) {
                    alert(apiResponse.error); //// TEST
                    return;
                }
                // No error => assuming valid "data"
                const buildingsDataList = apiResponse.data;
                if (!buildingsDataList) {
                    return;
                }
                cache.setCacheBuildingsDataControlledByChainAndAddress(this.chainId, address, buildingsDataList);
            } catch (error: any) {
                console.log(`--- [populateControlledBuildings] ERROR:`, error); //// TEST
                return;
            }
        }
        // At this point, the data for "address" should be cached
        const buildingsDataList = cache.getData().buildingsDataControlledByChainAndAddress[this.chainId][address];
        const buildingsData = buildingsDataList.buildingsData
            .filter(buildingData => {
                // Ensure matching building type
                const buildingType = buildingData.buildingDetails.buildingType;
                return buildingType === this.parentProcessor.getId();
            });
        if (!buildingsData.length) {
            return;
        }
        const asteroidIds: string[] = [];
        // Sort buildings by asteroid ID and lot index
        buildingsData.sort(this.compareBuildingsByAsteroidIdAndLotIndex);
        const elBuildingsList = createEl('div', null, ['buildings-list']);
        // Generate list-item header
        const elListItemHeader = createEl('div', null, ['list-item', 'list-item-header']);
        elListItemHeader.innerHTML = /*html*/ `
            <div>Asteroid ID</div>
            <div>Lot Index</div>
            <div>Building Name</div>
            <div>Crew Name</div>
            <div>Running Processes</div>
        `;
        elBuildingsList.append(elListItemHeader);
        // Generate list-item for each (filtered) building
        buildingsData.forEach(buildingData => {
            const fakeLotData: LotData = {
                lotId: buildingData.lotId,
                buildingData,
            };
            let runningProcessesHtml = '';
            const runningProcessesData = gameDataService.getRunningProcessesDataFromLotData(fakeLotData);
            if (runningProcessesData.length) {
                runningProcessesData.forEach(processData => {
                    const processId = processData.processId;
                    const processName = processService.getProcessDataById(processId).name;
                    const endDate = new Date(processData.finishTime * 1000);
                    const processFinish = fromNow(endDate) || '';
                    runningProcessesHtml += /*html*/ `
                        <div>${processName} <span class="process-finish">(done ${processFinish})</span></div>
                    `;
                })
            }
            const lotPosition = gameDataService.getAsteroidIdAndLotIndex(Number(buildingData.lotId));
            if (!lotPosition) {
                return;
            }
            const asteroidId = lotPosition.asteroidId.toString();
            const lotIndex = lotPosition.lotIndex.toString();
            uniquePushToArray(asteroidIds, asteroidId);
            const elListItem = createEl('div', null, ['list-item']);
            elListItem.innerHTML = /*html*/ `
                <div>${asteroidId}</div>
                <div>${lotIndex}</div>
                <div>${gameDataService.getBuildingNameFromBuildingData(buildingData)}</div>
                <div>${buildingData.crewName || ''}</div>
                <div>${runningProcessesHtml}</div>
            `;
            elListItem.dataset.asteroidId = asteroidId;
            elListItem.addEventListener('click', () => this.selectBuildingLot(buildingData.lotId));
            elBuildingsList.append(elListItem);
        });
        // Generate filters based on asteroid IDs (if multiple distinct asteroids)
        const elFilters = createEl('div', null, ['overlay-filters']);
        if (asteroidIds.length >= 2) {
            const elCheckboxes = createEl('div', null, ['filter-checkboxes']);
            asteroidIds.forEach(asteroidId => {
                const elLabel = createEl('label');
                elLabel.innerHTML = /*html*/ `
                    <input type="checkbox" name="filter-by-asteroid-id" value="${asteroidId}" checked>
                    ${asteroidId}
                `;
                elLabel.querySelector('input[type="checkbox"]')?.addEventListener('change', this.onChangeFilterByAsteroidId.bind(this));
                elCheckboxes.append(elLabel);
            });
            elFilters.append(elCheckboxes);
        }
        // Populate "elControlledBuildings"
        const elText1 = createEl('div');
        elText1.textContent = 'Select one of the matching buildings controlled by you in-game:';
        const elText2 = createEl('div');
        elText2.textContent = '... or lookup a specific lot:';
        this.elControlledBuildings.append(elText1);
        this.elControlledBuildings.append(elFilters);
        this.elControlledBuildings.append(elBuildingsList);
        this.elControlledBuildings.append(elText2);
    }

    private compareBuildingsByAsteroidIdAndLotIndex(b1: BuildingData, b2: BuildingData): number {
        const pos1 = gameDataService.getAsteroidIdAndLotIndex(Number(b1.lotId));
        const pos2 = gameDataService.getAsteroidIdAndLotIndex(Number(b2.lotId));
        if (!pos1 || !pos2) {
            return 0;
        }
        // Compare by asteroid ID
        let diff = pos1.asteroidId - pos2.asteroidId;
        if (diff !== 0) {
            return diff;
        }
        // Compare by lot index
        return pos1.lotIndex - pos2.lotIndex;
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
            <div class="controlled-buildings"></div>
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
        this.elControlledBuildings = this.elOverlayContent.querySelector('.controlled-buildings') as HTMLElement;
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
        // Load the data for the pre-set asteroid ID and lot index (if any)
        this.onChangedValues();
        this.updateLotData();
        // Load the matching buildings controlled by the connected wallet (if any)
        this.populateControlledBuildings();
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
