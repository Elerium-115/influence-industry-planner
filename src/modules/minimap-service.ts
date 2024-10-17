import {createEl} from './dom-core.js';
import {PROCESSOR_BUILDING_IDS, PROCESSOR_COLOR_SEMIFADED_BY_BUILDING_ID} from './processor-service.js';

/**
 * NOTE: This requires "pagemap.min.js" to be included via <script> in the HTML.
 */
const pagemap = globalThis.pagemap;

/**
 * Singleton
 */
class MinimapService {
    private static instance: MinimapService;

    private elMinimapWrapper: HTMLElement;

    constructor() {
        // Always "HTMLElement", never "null"
        this.elMinimapWrapper = document.getElementById('minimap-wrapper') as HTMLElement;
    }

    public static getInstance(): MinimapService {
        if (!MinimapService.instance) {
            MinimapService.instance = new MinimapService();
        }
        return MinimapService.instance;
    }

    public toggleMinimap(): void {
        this.elMinimapWrapper.classList.toggle('minimized');
    }

    public resetMinimap(): void {
        const elMinimapCanvasOld = document.getElementById('minimap-canvas');
        if (elMinimapCanvasOld) {
            elMinimapCanvasOld.parentElement?.removeChild(elMinimapCanvasOld);
        }
        // The new minimap canvas must be visible when initialized
        this.elMinimapWrapper.classList.remove('minimized');
        const elMinimapCanvasNew = createEl('canvas', 'minimap-canvas');
        this.elMinimapWrapper.appendChild(elMinimapCanvasNew);
        pagemap(elMinimapCanvasNew, {
            styles: {
                '.startup-products-list': 'rgba(255, 255, 255, 0.25)',
                '.processor.-extractor': PROCESSOR_COLOR_SEMIFADED_BY_BUILDING_ID[PROCESSOR_BUILDING_IDS.EXTRACTOR],
                '.processor.-bioreactor': PROCESSOR_COLOR_SEMIFADED_BY_BUILDING_ID[PROCESSOR_BUILDING_IDS.BIOREACTOR],
                '.processor.-refinery': PROCESSOR_COLOR_SEMIFADED_BY_BUILDING_ID[PROCESSOR_BUILDING_IDS.REFINERY],
                '.processor.-factory': PROCESSOR_COLOR_SEMIFADED_BY_BUILDING_ID[PROCESSOR_BUILDING_IDS.FACTORY],
                '.processor.-shipyard': PROCESSOR_COLOR_SEMIFADED_BY_BUILDING_ID[PROCESSOR_BUILDING_IDS.SHIPYARD],
                '.processor.-empty-lot': PROCESSOR_COLOR_SEMIFADED_BY_BUILDING_ID[PROCESSOR_BUILDING_IDS.EMPTY_LOT],
                '.process.broken': 'rgb(223, 67, 0)',
            },
            view: 'rgba(255, 255, 255, 0.25)',
            drag: 'rgba(255, 255, 255, 0.4)',
            interval: 50, // auto-update minimap, on DOM changes
        });
    }
}

const minimapService: MinimapService = MinimapService.getInstance(); // singleton

export {
    minimapService,
}
