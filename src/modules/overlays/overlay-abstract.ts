import {createEl} from '../dom-core.js';

/**
 * Usage:
 * - extend this class from e.g. `OverlayExample`
 * - implement `OverlayExample.makeElOverlayContent`
 * - trigger that overlay from other modules / services, by calling `new OverlayExample()`
 */
abstract class OverlayAbstract {
    private htmlElement: HTMLElement;
    protected elOverlayContent: HTMLElement;

    constructor() {
        //// TO DO: auto-close any other overlays?
        this.htmlElement = this.makeHtmlElement();
        this.elOverlayContent = this.makeElOverlayContent();
        this.htmlElement.querySelector('.overlay-content')?.append(this.elOverlayContent);
        document.body.append(this.htmlElement);
        // Listen for key strokes
        window.addEventListener('keydown', this.onKeydown);
    }

    protected abstract makeElOverlayContent(): HTMLElement;

    private onKeydown = (event: KeyboardEvent) => {
        // Pressing "Escape" while this overlay is visible, closes this overlay
        if (event.key === 'Escape') {
            window.removeEventListener('keydown', this.onKeydown);
            this.remove();
        }
    }

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
