import {createEl} from '../dom-core.js';

abstract class OverlayAbstract {
    private htmlElement: HTMLElement;
    protected elOverlayContent: HTMLElement;

    constructor() {
        this.htmlElement = this.makeHtmlElement();
        this.elOverlayContent = this.makeContentHtmlElement();
        this.htmlElement.querySelector('.overlay-content')?.append(this.elOverlayContent);
        document.body.append(this.htmlElement);
    }

    protected abstract makeContentHtmlElement(): HTMLElement;

    private makeHtmlElement(): HTMLElement {
        const el = createEl('div', null, ['overlay']);
        el.innerHTML = /*html*/ `
            <div class="close-overlay-button"></div>
            <div class="overlay-content"></div>
        `;
        el.querySelector('.close-overlay-button')?.addEventListener('click', this.remove.bind(this));
        return el;
    }

    protected remove(): void {
        this.htmlElement.parentElement?.removeChild(this.htmlElement);
    }
}

export {
    OverlayAbstract,
}
