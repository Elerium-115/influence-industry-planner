import {createEl} from '../dom-core.js';
import {OverlayAbstract} from './overlay-abstract';
import {Processor} from '../processor.js';

class OverlayAddExtraction extends OverlayAbstract {
    private parentProcessor: Processor;

    constructor(parentProcessor: Processor) {
        super();

        this.parentProcessor = parentProcessor;
        this.populateElOverlayContent();
    }

    private onClickExtraction(processId: number): void {
        this.parentProcessor.addProcessById(processId);
        this.remove();
    }

    private populateElOverlayContent(): void {
        const processorClassName = this.parentProcessor.getProcessorClassName();
        this.elOverlayContent.innerHTML = /*html*/ `
            <div class="overlay-header">
                <div class="overlay-title">Add Extraction</div>
                <div class="processor ${processorClassName}">
                    <div class="processor-header">
                        <div class="processor-name">${this.parentProcessor.getName()}</div>
                    </div>
                </div>
            </div>
            <div class="extractions-list"></div>
        `;
    }

    protected makeElOverlayContent(): HTMLElement {
        const el = createEl('div', null, ['overlay-add-extraction']);
        // NOT populating this element yet, because it's created in the "super" constructor, before setting the properties of this class
        return el;
    }
}

export {
    OverlayAddExtraction,
}
