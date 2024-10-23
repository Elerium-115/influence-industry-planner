import * as getStarknet from 'get-starknet';
import {type ConnectedStarknetWindowObject} from 'get-starknet-core';
import {type AccountInterface} from 'starknet';
import {getCompactAddress} from './abstract-core.js';

/**
 * Singleton
 */
class StarknetService {
    private static instance: StarknetService;

    private starknet: ConnectedStarknetWindowObject|undefined;

    private elStarknetConnect: HTMLElement;
    private elStarknetWallet: HTMLElement;
    private elStarknetWalletIcon: HTMLImageElement;
    private elStarknetWalletAddress: HTMLElement;
    // NOTE: NO "Disconnect" button b/c calling "getStarknet.disconnect" does NOT disconnect the wallet

    constructor() {
        // Always "HTMLElement", never "null"
        this.elStarknetConnect = document.getElementById('starknet-connect') as HTMLElement;
        this.elStarknetWallet = document.getElementById('starknet-wallet') as HTMLElement;
        this.elStarknetWalletIcon = this.elStarknetWallet.querySelector('.icon') as HTMLImageElement;
        this.elStarknetWalletAddress = this.elStarknetWallet.querySelector('.address') as HTMLElement;
        this.elStarknetWalletAddress.dataset.tooltipPosition = 'bottom-right';
        // Call via setTimeout, to allow "starknet" to become set on page-load, if previously connected
        setTimeout(async () => {
            this.starknet = global.starknet;
            if (typeof this.starknet === 'undefined') {
                // NOT previously connected => show the "Connect" button (do NOT auto-trigger the modal)
                this.starknetUpdateState();
            } else {
                // Previously connected => auto-connect (this will also trigger "starknetUpdateState")
                await this.starknetConnect();
            }
        }, 100);
    }

    public static getInstance(): StarknetService {
        if (!StarknetService.instance) {
            StarknetService.instance = new StarknetService();
        }
        return StarknetService.instance;
    }

    private resetElStarknetWallet(): void {
        this.elStarknetWallet.classList.add('hidden');
        this.elStarknetWalletIcon.src = '';
        this.elStarknetWalletAddress.textContent = '';
        delete this.elStarknetWalletAddress.dataset.tooltip;
    }

    private starknetUpdateState(): void {
        console.log(`--- starknet:`, this.starknet); //// TEST
        if (typeof this.starknet === 'undefined') {
            // NO starknet
            this.elStarknetConnect.classList.remove('hidden');
            this.resetElStarknetWallet();
            return;
        }
        if (!this.starknet.isConnected) {
            // starknet NOT connected
            this.elStarknetConnect.classList.remove('hidden');
            this.resetElStarknetWallet();
            return;
        }
        // starknet CONNECTED
        const account: AccountInterface = this.starknet.account;
        const address = account.address;
        this.elStarknetWalletIcon.src = this.starknet.icon;
        this.elStarknetWalletAddress.textContent = getCompactAddress(address);
        this.elStarknetWalletAddress.dataset.tooltip = address;
        this.elStarknetConnect.classList.add('hidden');
        this.elStarknetWallet.classList.remove('hidden');
    }

    public async starknetConnect(): Promise<void> {
        await getStarknet.connect();
        this.starknetUpdateState();
    }
}

const starknetService: StarknetService = StarknetService.getInstance(); // singleton

export {
    starknetService,
}
