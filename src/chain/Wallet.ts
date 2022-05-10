import { watchEffect, markRaw } from 'vue';

import type { AccountInterface } from '@/starknet_wrapper';

import { logDebug, logDebugDelay } from '../Messages';

import { watchSignerChanges } from '@/chain/Contracts';

import { legacySetsMgr } from '../components/builder/set_browser/LegacySetsMgr';

import { setWalletInitComplete } from './WalletLoading';

import { reactive } from 'vue';
import { chooseDefaultNetwork, getCurrentNetwork, setNetwork } from './Network';

import { connect, disconnect, IStarknetWindowObject } from '@/starknet_wrapper';

import { setupMockWallet } from './MockWallet';
import { APP_ENV } from '@/Meta';

class WalletStore {
    signer: undefined | AccountInterface = undefined;
    userWalletAddress = '';

    starknetObject?: IStarknetWindowObject;

    // Empty, because at this point we aren't a proxy to a reactive object.
    constructor() {}

    async initialize() {
        const storedAddress = window.localStorage.getItem('user_address');
        logDebugDelay(() => ['STARTING WALLET CONNECT', storedAddress]);

        if (APP_ENV === 'dev')
            setupMockWallet();
        else {
            const cwo = await connect({ showList: false });

            if (cwo)
                this.enableWallet(cwo);
        }

        // Mark the promise as complete - we've either succeeded at connecting or we don't have a default wallet/some other issue.
        setWalletInitComplete();

        watchSignerChanges(this);

        watchEffect(() => {
            // TODO: switch to IDB
            logDebug('Writing address ', this.userWalletAddress);
            window.localStorage.setItem('user_address', this.userWalletAddress);
        });

        return;
    }

    async openWalletSelector() {
        const cwo = await connect({ showList: true });
        if (cwo)
            this.enableWallet(cwo);
    }

    async setSignerFromGSW() {
        if (this.starknetObject?.isConnected) {
            this.setSigner({ signer: markRaw(this.starknetObject.account), addr: this.starknetObject.account.address });
            this.setProviderFromSigner();
        }
    }

    enableWallet(starknetObj: IStarknetWindowObject) {
        this.starknetObject = starknetObj;
        // Don't await this, we don't care
        this.starknetObject.enable().then(() => this.setSignerFromGSW());
        this.starknetObject.on('accountsChanged', () => this.setSignerFromGSW());
    }

    setSigner(data: { signer: AccountInterface; addr: string }) {
        this.signer = data.signer;
        this.userWalletAddress = data.addr;
        legacySetsMgr.setup(this);
    }

    disconnect() {
        disconnect({
            clearLastWallet: true,
            clearDefaultWallet: true,
        });
        this.signer = undefined;
        this.userWalletAddress = '';
        legacySetsMgr.setup(this);
    }

    // TODO: might want to split the signer network from the provider network?
    getNetwork() {
        return getCurrentNetwork();
    }

    setProviderFromSigner() {
        if (!this.signer)
            chooseDefaultNetwork();
        else if (this.signer.gatewayUrl.indexOf('alpha-mainnet.starknet') !== -1)
            setNetwork('starknet-mainnet');
        else if (this.signer.gatewayUrl.indexOf('alpha4.starknet') !== -1)
            setNetwork('starknet-testnet');
        else if (this.signer.gatewayUrl.indexOf('localhost:5050') !== -1)
            setNetwork('mock');
        else
            setNetwork('localhost');
    }
}

export const walletStore2 = reactive(new WalletStore());
walletStore2.initialize();
