import { watchEffect, markRaw } from 'vue';

import type { AccountInterface } from '@/starknet_wrapper';

import { logDebug, logDebugDelay } from '../Messages';

import { watchSignerChanges } from '@/chain/Contracts';

import { setWalletInitComplete } from './WalletLoading';

import { reactive } from 'vue';
import { chooseDefaultNetwork, getCurrentNetwork, setNetwork } from './Network';

import { connect, disconnect, IStarknetWindowObject } from '@/starknet_wrapper';

import { setupMockWallet } from './MockWallet';
import { APP_ENV } from '@/Meta';

export type UserID = string;

export class WalletStore {
    signer: undefined | AccountInterface = undefined;

    // See also user_id below.
    userWalletAddress = '';

    starknetObject?: IStarknetWindowObject;

    // Empty, because at this point we aren't a proxy to a reactive object.
    constructor() {}

    async init() {
        const storedAddress = window.localStorage.getItem('user_address');
        logDebugDelay(() => ['STARTING WALLET CONNECT', storedAddress]);

        if (storedAddress && storedAddress.indexOf('/')) {
            this.userWalletAddress = storedAddress.split('/')[1];
            setNetwork(storedAddress.split('/')[0]);
        }

        if (APP_ENV !== 'prod')
            setupMockWallet();

        // Mark the promise as complete - we've either succeeded at connecting or we don't have a default wallet/some other issue.
        setWalletInitComplete(this);

        watchSignerChanges(this);

        watchEffect(() => {
            // TODO: switch to IDB
            logDebug('Writing address ', this.user_id);
            window.localStorage.setItem('user_address', this.user_id || '');
        });
        return this;
    }

    async ensureEnabled(showList = false) {
        const cwo = await connect({ showList });
        if (cwo)
            await this.enableWallet(cwo);
        else if (!showList)
            this.ensureEnabled(true);
        await new Promise((resolve, _) => {
            setTimeout(() => resolve(null), 0);
        })
    }

    async openWalletSelector() {
        const cwo = await connect({ showList: true });
        if (cwo)
            // Don't await this, we don't care
            this.enableWallet(cwo);
    }

    async enableWallet(starknetObj: IStarknetWindowObject) {
        this.starknetObject = starknetObj;
        await this.starknetObject.enable();
        await this.setSignerFromGSW();
        this.starknetObject.on('accountsChanged', () => this.setSignerFromGSW());
    }

    async setSignerFromGSW() {
        if (this.starknetObject?.isConnected) {
            this.signer = markRaw(this.starknetObject.account);
            this.userWalletAddress = this.starknetObject.account.address;
            this.setProviderFromSigner();
        }
    }

    disconnect() {
        disconnect({
            clearLastWallet: true,
            clearDefaultWallet: true,
        });
        this.signer = undefined;
        this.userWalletAddress = '';
    }

    // TODO: might want to split the signer network from the provider network?
    getNetwork() {
        return getCurrentNetwork();
    }

    setProviderFromSigner() {
        if (!this.signer)
            chooseDefaultNetwork();
        else if ((this.signer.gatewayUrl || this.signer.provider.gatewayUrl).indexOf('alpha-mainnet.starknet') !== -1)
            setNetwork('starknet-mainnet');
        else if ((this.signer.gatewayUrl || this.signer.provider.gatewayUrl).indexOf('alpha4.starknet') !== -1)
            setNetwork('starknet-testnet');
        else if ((this.signer.gatewayUrl || this.signer.provider.gatewayUrl).indexOf('mock_chain') !== -1)
            setNetwork('mock');
        else
            setNetwork('localhost');
    }

    getShortAddress() {
        if (!this.userWalletAddress)
            return undefined;
        return this.userWalletAddress.substring(0, 5) + '...' + this.userWalletAddress.substring(this.userWalletAddress.length - 4);
    }

    get user_id(): UserID | undefined {
        if (!this.userWalletAddress)
            return undefined;
        return `${getCurrentNetwork()}/${this.userWalletAddress}`;
    }
}

export const walletStore = reactive(new WalletStore()) as unknown as WalletStore;
walletStore.init();
