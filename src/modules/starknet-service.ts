import {
    connect,
    ConnectorData,
    StarknetkitConnector,
    StarknetWindowObject,
} from 'starknetkit';
import * as starknet from 'starknet';
import {type Signature} from 'starknet';
import {type ChainId, getCompactAddress} from './abstract-core.js';
import {apiService} from './api-service.js';

/**
 * Singleton
 */
class StarknetService {
    private static instance: StarknetService;

    /**
     * This becomes TRUE when all these conditions are met:
     * - a Starknet wallet is connected
     * - a valid auth token exists (or becomes set) in local-storage
     */
    private isAuthed: boolean = false;

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

    public setIsAuthed(isAuthed: boolean): void {
        console.log(`--- SET isAuthed:`, isAuthed); //// TEST
        this.isAuthed = isAuthed;
        this.elStarknetWallet.classList.toggle('is-authed', isAuthed);
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

    private async starknetUpdate(): Promise<void> {
        this.updateAddress();
        await this.updateChainId();
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
        await this.starknetUpdate();
        if (!wallet || !connector || !connectorData) {
            this.setIsAuthed(false);
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
        // Validate the auth token from local-storage (if any), before setting "isAuthed"
        const token = localStorage.getItem('authToken') || '';
        if (!token) {
            // NO token in local-storage => trigger login flow
            this.setIsAuthed(false);
            await this.login();
            // At this point, if the login was successful, the user is authed
            return;
        } else {
            try {
                const isValidToken = await this.verifyToken(token);
                this.setIsAuthed(isValidToken);
            } catch (error: any) {
                this.setIsAuthed(false);
            }
        }
    }

    private async signMessage(typedData: starknet.TypedData): Promise<Signature|null> {
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
        } catch (error: any) {
            throw error;
        }
    }

    public async login(): Promise<void> {
        let typedData: starknet.TypedData|undefined;
        let token: string|undefined;
        try {
            const messageLoginResponse = await apiService.generateMessageLogin(this.connectedAddress, this.connectedChainId as ChainId);
            typedData = messageLoginResponse.typedData;
            token = messageLoginResponse.token;
        } catch (error: any) {
            console.log(`---> [login] ERROR generating the message:`, error); //// TEST
            return;
        }
        if (!typedData || !token) {
            console.log(`---> [login] ERROR parsing the message:`, {typedData, token}); //// TEST
            return;
        }
        let signature: Signature|null = null;
        try {
            signature = await this.signMessage(typedData);
        } catch (error: any) {
            console.log(`---> [login] ERROR signing the message:`, error); //// TEST
        }
        if (!signature) {
            // Login refused by user (or wallet not connected)
            return;
        }
        try {
            const apiResponse = await apiService.verifySignature(typedData, signature, token);
            if (apiResponse.success) {
                // Login success
                console.log(`---> [login] SUCCESS`); //// TEST
                localStorage.setItem('authToken', apiResponse.token as string);
                this.setIsAuthed(true);
            } else {
                // Login failed verification
                console.log(`---> [login] FAILED`); //// TEST
                alert(apiResponse.error); //// TEST
            }
        } catch (error: any) {
            console.log(`---> [login] ERROR verifying the signature:`, error); //// TEST
            alert('ERROR verifying the signature'); //// TEST
        }
    }

    public async verifyToken(token: string): Promise<boolean> {
        try {
            const apiResponse = await apiService.verifyToken(token);
            if (apiResponse.success) {
                return true;
            } else {
                return false;
            }
        } catch (error: any) {
            return false;
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
