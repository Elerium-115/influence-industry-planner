/**
 * Singleton
 */
class GlobalService {
    private static instance: GlobalService;

    private isPending: boolean = false;

    public static getInstance(): GlobalService {
        if (!GlobalService.instance) {
            GlobalService.instance = new GlobalService();
        }
        return GlobalService.instance;
    }

    public getIsPending(): boolean {
        return this.isPending;
    }

    public setIsPending(isPending: boolean): void {
        this.isPending = isPending;
        document.body.classList.toggle('is-pending', isPending);
    }
}

const globalService: GlobalService = GlobalService.getInstance(); // singleton

export {
    globalService,
}
