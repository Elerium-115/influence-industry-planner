/**
 * Singleton
 */
class MinimapService {
    private static instance: MinimapService;

    constructor() {}

    public static getInstance(): MinimapService {
        if (!MinimapService.instance) {
            MinimapService.instance = new MinimapService();
        }
        return MinimapService.instance;
    }

    public toggleMinimap(): void {
        console.log(`--- [toggleMinimap]`); //// TEST
    }
}

const minimapService: MinimapService = MinimapService.getInstance(); // singleton

export {
    minimapService,
}
