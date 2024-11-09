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

    public setIsPending(isPending: boolean, pendingMessage: string = 'Processing...'): void {
        this.isPending = isPending;
        document.body.classList.toggle('is-pending', isPending);
        document.body.dataset.pendingMessage = isPending ? pendingMessage : '';
    }
}

const globalService: GlobalService = GlobalService.getInstance(); // singleton

export {
    globalService,
}
