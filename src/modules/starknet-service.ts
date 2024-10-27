import {
    connect,
    ConnectorData,
    StarknetkitConnector,
    StarknetWindowObject,
} from 'starknetkit';
import * as starknet from 'starknet';
import {type Signature} from 'starknet';
import {getCompactAddress} from './abstract-core.js';
import {mockApi} from './mock-api.js';

type ChainId = 'SN_MAIN'|'SN_SEPOLIA';

/**
 * Singleton
 */
class StarknetService {
    private static instance: StarknetService;

    private wallet: StarknetWindowObject|null|undefined = null;
    private connector: StarknetkitConnector|null = null;
    private connectorData: ConnectorData|null = null;
    private connectedAddress: string|'' = ''; // 64-bit address prefixed by "0x"
    private connectedChainId: ChainId|'' = '';
    private elStarknetConnect: HTMLElement;
    private elStarknetWallet: HTMLElement;
    private elStarknetWalletIcon: HTMLImageElement;
    private elStarknetWalletAddress: HTMLElement;
    // NOTE: NO "Disconnect" button b/c calling "getStarknet.disconnect" does NOT disconnect the wallet

    constructor () {
        // Always "HTMLElement", never "null"
        this.elStarknetConnect = document.getElementById('starknet-connect') as HTMLElement;
        this.elStarknetWallet = document.getElementById('starknet-wallet') as HTMLElement;
        this.elStarknetWalletIcon = this.elStarknetWallet.querySelector('.icon') as HTMLImageElement;
        this.elStarknetWalletAddress = this.elStarknetWallet.querySelector('.address') as HTMLElement;
        this.elStarknetWalletAddress.dataset.tooltipPosition = 'bottom-right';
        // Do NOT trigger the wallet connection modal on page-load
        this.starknetConnect('neverAsk');
    }

    public static getInstance(): StarknetService {
        if (!StarknetService.instance) {
            StarknetService.instance = new StarknetService();
        }
        return StarknetService.instance;
    }

    private updateAddress(): void {
        if (!this.connectorData) {
            this.connectedAddress = '';
            return;
        }
        let address = this.connectorData.account as string;
        // Remove any "0x" prefix, then pad to 64 hex characters and add back "0x"
        this.connectedAddress = '0x' + address.replace(/^0x/, '').padStart(64, '0');
    }

    private async updateChainId(): Promise<void> {
        if (!this.wallet) {
            this.connectedChainId = '';
            return;
        }
        const chainId = await this.wallet.request({type: 'wallet_requestChainId'});
        switch (chainId) {
            case 'SN_MAIN':
            case '0x534e5f4d41494e':
                this.connectedChainId = 'SN_MAIN';
                break;
            case 'SN_SEPOLIA':
            case '0x534e5f5345504f4c4941':
                this.connectedChainId = 'SN_SEPOLIA';
                break;
            default:
                this.connectedChainId = '';
                break;
        }
    }

    private starknetUpdate(): void {
        // console.log(`--- starknetkit:`, {wallet: this.wallet, connector: this.connector, connectorData: this.connectorData}); //// TEST
        this.updateAddress();
        this.updateChainId();
        if (!this.wallet) {
            // starknet NOT connected
            this.elStarknetConnect.classList.remove('hidden');
            this.elStarknetWallet.classList.add('hidden');
            this.elStarknetWalletIcon.src = '';
            this.elStarknetWalletAddress.textContent = '';
            delete this.elStarknetWalletAddress.dataset.tooltip;
            return;
        }
        // starknet CONNECTED
        this.elStarknetWalletIcon.src = this.wallet.icon as string;
        this.elStarknetWalletAddress.textContent = getCompactAddress(this.connectedAddress);
        this.elStarknetWalletAddress.dataset.tooltip = this.connectedAddress;
        this.elStarknetConnect.classList.add('hidden');
        this.elStarknetWallet.classList.remove('hidden');
    }

    private async starknetConnect(modalMode: 'alwaysAsk'|'canAsk'|'neverAsk' = 'alwaysAsk'): Promise<void> {
        const wasConnected = Boolean(this.wallet);
        const {wallet, connector, connectorData} = await connect({modalMode});
        this.wallet = wallet;
        this.connector = connector;
        this.connectorData = connectorData;
        this.starknetUpdate();
        if (!wallet || !connector || !connectorData) {
            return;
        }
        /**
         * Wallet connected, at this point.
         * 
         * NOTE: "type" values and responses when calling "wallet.request({type: ...})"
         * - "wallet_getPermissions" => ["accounts"]
         * - "wallet_requestAccounts" => ["0x1234...6789"] - connected wallet address
         * - "wallet_requestChainId" => 0x534e5f4d41494e (for "SN_MAIN") / 0x534e5f5345504f4c4941 (for "SN_SEPOLIA")
         * - "wallet_supportedSpecs" => ["0.4", "0.5", "0.6"] - as of 2024-10-25
         * - "wallet_signTypedData" => Signature
         */
        if (!wasConnected) {
            /**
             * Add event listeners only if the wallet was NOT already connected.
             * This avoids re-adding the listeners multiple times, when this
             * function is called from one of the existing event listeners.
             */
            wallet.on('accountsChanged', this.onAccountsChanged.bind(this));
            wallet.on('networkChanged', this.onNetworkChanged.bind(this));
        }
    }

    private async signMessage(typedData: starknet.TypedData): Promise<Signature|null> {
        // console.log(`--- [signMessage] typedData:`, typedData); //// TEST
        if (!this.wallet) {
            return null;
        }
        try {
            /**
             * Signature elements for e.g. ["1", "2222...2222", "3333...3333"]
             * - "1" = "v" value (1 or 0), i.e. recovery parameter
             * - "2222...2222" = "r" value
             * - "3333...3333" = "s" value
             * 
             * NOTE: Type "SIGNATURE" is compatible with (but NOT identical to) type "Signature".
             */
            const signature = await (this.wallet as StarknetWindowObject).request({
                type: 'wallet_signTypedData',
                params: typedData,
            });
            return signature;
        } catch (error) {
            throw error;
        }
    }

    //// TO DO: when to auto-call this, without spamming it on each page-load?
    private async login(): Promise<void> {
        const {typedData, token} = await mockApi.generateMessageLogin(this.connectedAddress, this.connectedChainId as ChainId);

        let signature: Signature|null = null;
        try {
            signature = await this.signMessage(typedData);
        } catch (error) {
            console.log(`---> [login] ERROR signing the message:`, error); //// TEST
        }
        if (!signature) {
            // Login refused by user (or wallet not connected)
            //// ...
            return;
        }
        try {
            const verifyResult = await mockApi.verifySignature(typedData, signature, token);
            if (verifyResult.success) {
                // Login success
                console.log(`---> [login] SUCCESS`); //// TEST
                //// ...
            } else {
                // Login failed verification
                console.log(`---> [login] FAILED`); //// TEST
                //// ...
            }
        } catch (error) {
            console.log(`---> [login] ERROR verifying the signature:`, error); //// TEST
            //// ...
        }
    }

    private onAccountsChanged(accounts: string[]): void {
        console.log(`--- [onAccountsChanged] args:`, {accounts}); //// TEST
        this.starknetConnect('neverAsk');
    }

    private onNetworkChanged(networkId: string, accounts: string[]): void {
        console.log(`--- [onNetworkChanged] args:`, {networkId, accounts}); //// TEST
    }
}

const starknetService: StarknetService = StarknetService.getInstance(); // singleton

export {
    starknetService,
}