import {
    connect,
    ConnectorData,
    StarknetkitConnector,
    StarknetWindowObject,
} from 'starknetkit';
import * as starknet from 'starknet';
import {type Signature} from 'starknet';
import {getCompactAddress} from './abstract-core.js';

/**
 * Singleton
 */
class StarknetService {
    private static instance: StarknetService;

    private starknet: any;
    private wallet: StarknetWindowObject|null|undefined;
    private connector: StarknetkitConnector|null;
    private connectorData: ConnectorData|null;
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

    private getAddress64Bit(): string {
        if (!this.connectorData) {
            return '';
        }
        let address = this.connectorData.account as string;
        // Remove any "0x" prefix, then pad to 64 hex characters and add back "0x"
        address = '0x' + address.replace(/^0x/, '').padStart(64, '0');
        return address;
    }

    private makeTypedData(chainId: 'SN_MAIN'|'SN_SEPOLIA', message: string): starknet.TypedData {
        return {
            types: {
                StarkNetDomain: [
                    {name: 'name', type: 'felt'},
                    {name: 'chainId', type: 'felt'},
                    {name: 'version', type: 'felt'},
                ],
                StarknetMessage: [
                    {name: 'message', type: 'felt'},
                ],
            },
            primaryType: 'StarknetMessage',
            domain: {
                name: 'Industry Planner for Influence',
                version: '0.0.1',
                chainId,
            },
            message: {
                message,
            },
        };
    }

    private resetElStarknetWallet(): void {
        this.elStarknetWallet.classList.add('hidden');
        this.elStarknetWalletIcon.src = '';
        this.elStarknetWalletAddress.textContent = '';
        delete this.elStarknetWalletAddress.dataset.tooltip;
    }

    private starknetUpdateState(): void {
        const debugStarknet = {...this.starknet}; delete debugStarknet.icon; console.log(`--- starknet:`, debugStarknet); //// TEST
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
        const address = this.getAddress64Bit()
        this.elStarknetWalletIcon.src = this.starknet.icon;
        this.elStarknetWalletAddress.textContent = getCompactAddress(address);
        this.elStarknetWalletAddress.dataset.tooltip = address;
        this.elStarknetConnect.classList.add('hidden');
        this.elStarknetWallet.classList.remove('hidden');
    }

    private async starknetConnect(): Promise<void> {
        const {wallet, connector, connectorData} = await connect({});
        console.log(`--- connected wallet:`, {wallet, connector, connectorData}); //// TEST
        this.wallet = wallet;
        this.connector = connector;
        this.connectorData = connectorData;
        if (!wallet || !connector || !connectorData) {
            return;
        }
        /**
         * NOTE: "type" values and responses when calling "wallet.request({type: ...})"
         * - "wallet_getPermissions" => ["accounts"]
         * - "wallet_requestAccounts" => ["0x1234...6789"] - connected wallet address
         * - "wallet_requestChainId" => 0x534e5f4d41494e (for "SN_MAIN") / 0x534e5f5345504f4c4941 (for "SN_SEPOLIA")
         * - "wallet_supportedSpecs" => ["0.4", "0.5", "0.6"] - as of 2024-10-25
         * - "wallet_signTypedData" => Signature
         */
        wallet.on('accountsChanged', this.onAccountsChanged.bind(this));
        wallet.on('networkChanged', this.onNetworkChanged.bind(this));
        this.starknetUpdateState();
    }

    private async signMessage(typedData: starknet.TypedData): Promise<Signature|null> {
        console.log(`--- [signMessage] typedData:`, typedData); //// TEST
        if (!this.wallet) {
            console.log(`---> [signMessage] NO wallet`); //// TEST
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
            console.log(`---> [signMessage] signature:`, signature); //// TEST
            return signature;
        } catch (error) {
            console.log(`---> [signMessage] ERROR:`, error); //// TEST
            return null;
        }
    }

    //// TO DO: when to call this, without spamming it on each page-load?
    private async login(): Promise<void> {
        console.log(`--- [login]`); //// TEST
        //// TO DO: set "chainId" based on currently connected wallet's chain
        const typedDataLogin = this.makeTypedData('SN_MAIN', 'Login');
        let signature: Signature|null = null;
        try {
            signature = await this.signMessage(typedDataLogin);
        } catch (error) {
            console.log(`---> [login] ERROR signing the message:`, error); //// TEST
        }
        if (!signature) {
            console.log(`---> [login] NO signature`); //// TEST
            return;
        }
        //// TO DO: this verification must be done in the API
        try {
            // Source: https://dev.to/bastienfaivre/a-guide-on-starknet-signatures-a3m
            const nodeUrl: string = 'https://starknet-mainnet.public.blastapi.io/rpc/v0_7';
            const rpcProvider = new starknet.RpcProvider({nodeUrl});
            // "0x123" is a placeholder for the user's private key (no access to it)
            const verifierAccount = new starknet.Account(rpcProvider, this.getAddress64Bit(), '0x123');
            const isValidSignature = await verifierAccount.verifyMessage(typedDataLogin, signature);
            console.log(`---> [login] isValidSignature:`, isValidSignature); //// TEST
        } catch (error) {
            console.log(`---> [login] ERROR verifying the signature:`, error); //// TEST
        }
    }

    private onAccountsChanged(accounts: string[]): void {
        console.log(`--- [onAccountsChanged] args:`, {accounts}); //// TEST
    }

    private onNetworkChanged(networkId: string, accounts: string[]): void {
        console.log(`--- [onNetworkChanged] args:`, {networkId, accounts}); //// TEST
    }
}

const starknetService: StarknetService = StarknetService.getInstance(); // singleton

export {
    starknetService,
}
