import {createEl} from '../dom-core.js';
import {OverlayAbstract} from './overlay-abstract';
import {Processor} from '../processor.js';
import {processorService} from '../processor-service.js';

class OverlayLinkLot extends OverlayAbstract {
    private parentProcessor: Processor;
    private elInputAsteroidId: HTMLInputElement;
    private elInputLotIndex: HTMLInputElement;
    private elCheckButton: HTMLElement;
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
        const allValuesSet = Boolean(this.elInputAsteroidId.value && this.elInputLotIndex.value);
        this.elCheckButton.classList.toggle('hidden', !allValuesSet);
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

    private async onClickCheckButton(): Promise<void> {
        console.log(`--- [onClickCheckButton]`); //// TEST
    }

    private onClickRemoveButton(): void {
        this.parentProcessor.setAsteroidIdAndLotIndex(null, null);
        this.parentProcessor.onProcessChanged();
        this.remove();
    }

    private async onClickSaveButton(): Promise<void> {
        const allValuesSet = Boolean(this.elInputAsteroidId.value && this.elInputLotIndex.value);
        if (allValuesSet) {
            const asteroidId = Number(this.elInputAsteroidId.value);
            const lotIndex = Number(this.elInputLotIndex.value);
            this.parentProcessor.setAsteroidIdAndLotIndex(asteroidId, lotIndex);
            await processorService.updateLocationForProcessor(this.parentProcessor);
        } else {
            this.parentProcessor.setAsteroidIdAndLotIndex(null, null);
        }
        this.parentProcessor.onProcessChanged();
        this.remove();
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
                <div class="form-cell form-cell-max">
                    <div class="cta-button check-button">Check</div>
                </div>
                <div class="form-cell">
                    <div class="cta-button remove-button">Remove</div>
                </div>
            </div>
            <div class="overlay-cta">
                <div class="cta-button save-button">Save</div>
            </div>
        `;
        this.elInputAsteroidId = this.elOverlayContent.querySelector('input[name="asteroid-id"]') as HTMLInputElement;
        this.elInputLotIndex = this.elOverlayContent.querySelector('input[name="lot-index"]') as HTMLInputElement;
        this.elCheckButton = this.elOverlayContent.querySelector('.check-button') as HTMLElement;
        const elRemoveButton = this.elOverlayContent.querySelector('.remove-button') as HTMLElement;
        this.elSaveButton = this.elOverlayContent.querySelector('.save-button') as HTMLElement;
        this.elInputAsteroidId.addEventListener('input', this.onInputAsteroidId.bind(this));
        this.elInputLotIndex.addEventListener('input', this.onInputLotIndex.bind(this));
        this.elCheckButton.addEventListener('click', this.onClickCheckButton.bind(this));
        elRemoveButton.addEventListener('click', this.onClickRemoveButton.bind(this));
        this.elSaveButton.addEventListener('click', this.onClickSaveButton.bind(this));
        elRemoveButton.classList.toggle('hidden', !this.parentProcessor.getHasLocation());
        this.onChangedValues();
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
