import { watchEffect, markRaw } from 'vue';

import type { AccountInterface } from 'starknet';
import * as starknet from 'starknet';

import { logDebug, logDebugDelay } from '../Messages';

import { watchSignerChanges } from '@/chain/ContractsLoader';

import { setWalletInitComplete } from './WalletLoading';

import { reactive } from 'vue';
import { chooseDefaultNetwork, getCurrentNetwork, setNetwork } from './Network';

import { connect, disconnect, StarknetWindowObject } from 'get-starknet';

import { setupMockWallet } from './MockWallet';
import { APP_ENV } from '@/Meta';
import { blockchainProvider } from './BlockchainProvider';
import { addBreadCrumb } from '@/Monitoring';

import { injectController, SupportedChainIds } from '@cartridge/controller';

export type UserID = string;

export class WalletStore {
    signer: undefined | AccountInterface = undefined;

    // See also user_id below.
    _userWalletAddress = '';

    _starknetIdDomain = '';

    starknetObject?: StarknetWindowObject;

    // Empty, because at this point we aren't a proxy to a reactive object.
    constructor() {}

    async init() {
        try {
            injectController(undefined, {
                chainId: APP_ENV === 'prod' ? SupportedChainIds.MAINNET : SupportedChainIds.TESTNET,
            });
        } catch(_) {
            // Ignore
            if (APP_ENV === 'dev')
                console.log(_);
        }

        const storedAddress = window.localStorage.getItem('user_address');
        logDebugDelay(() => ['STARTING WALLET CONNECT', storedAddress]);

        if (storedAddress && storedAddress.indexOf('/')) {
            this._userWalletAddress = storedAddress.split('/')[1];
            setNetwork(storedAddress.split('/')[0]);
        }

        if (APP_ENV !== 'prod')
            setupMockWallet();

        // Mark the promise as complete - we've either succeeded at connecting or we don't have a default wallet/some other issue.
        setWalletInitComplete(this);

        logDebug('WALLET INIT COMPLETE');

        watchSignerChanges(this);

        watchEffect(() => {
            // TODO: switch to IDB
            logDebug('Writing address ', this.user_id);
            if (!this.user_id)
                window.localStorage.removeItem('user_address');
            else
                window.localStorage.setItem('user_address', this.user_id || '');
        });

        connect({ modalMode: 'neverAsk' }).then(cwo => {
            if (!cwo)
                return;
            cwo.isPreauthorized().then(yes => {
                if (yes)
                    this.enableWallet(cwo);
            });
        });
        return this;
    }

    async ensureEnabled(showList = false) {
        if (this.starknetObject?.isConnected)
            return;
        const cwo = await connect({ modalMode: 'canAsk' });
        if (cwo)
            await this.enableWallet(cwo);
        else if (!showList)
            this.ensureEnabled(true);
        await new Promise((resolve, _) => {
            setTimeout(() => resolve(null), 0);
        })
    }

    async openWalletSelector() {
        const cwo = await connect({ modalMode: 'alwaysAsk' });
        if (cwo)
            // Don't await this, we don't care
            this.enableWallet(cwo);
    }

    async enableWallet(starknetObj: StarknetWindowObject) {
        this.starknetObject = starknetObj;
        await this.starknetObject.enable({ starknetVersion: 'v4' })
        await this.setSignerFromGSW();
        this.starknetObject.on('accountsChanged', () => this.setSignerFromGSW());
    }

    async setSignerFromGSW() {
        if (this.starknetObject?.isConnected) {
            this.signer = markRaw(this.starknetObject.account);
            this._userWalletAddress = this.starknetObject.account.address;
            fetch('https://app.starknet.id/api/indexer/addr_to_domain?addr=' + starknet.number.toBN(this._userWalletAddress).toString()).then(r => r.json()).then(r => {
                if (r.domain)
                    this._starknetIdDomain = r.domain;
            });
            this.setProviderFromSigner();
        }
    }

    disconnect() {
        disconnect({
            clearLastWallet: true,
        });

        this.signer = undefined;
        this._userWalletAddress = '';
    }

    // Return the provider for the current network, even if we aren't signed.
    getProvider() {
        return blockchainProvider.value;
    }

    setProviderFromSigner() {
        if (!this.signer)
            chooseDefaultNetwork();
        else if ((this.signer.gatewayUrl || this.signer.provider.gatewayUrl || '').indexOf('alpha-mainnet.starknet') !== -1 || this.signer?.provider?.chainId === '0x534e5f4d41494e')
            setNetwork('starknet-mainnet');
        else if ((this.signer.gatewayUrl || this.signer.provider.gatewayUrl || '').indexOf('alpha4-2') !== -1)
            setNetwork('starknet-testnet2');
        else if ((this.signer.gatewayUrl || this.signer.provider.gatewayUrl || '').indexOf('alpha4') !== -1 || this.signer?.provider?.chainId === '0x534e5f474f45524c49')
            setNetwork('starknet-testnet');
        else if ((this.signer.gatewayUrl || this.signer.provider.gatewayUrl || '').indexOf('mock_chain') !== -1)
            setNetwork('mock');
        else
            setNetwork('localhost');
    }

    getShortAddress() {
        if (!this._userWalletAddress)
            return undefined;
        return this._userWalletAddress.substring(0, 5) + '...' + this._userWalletAddress.substring(this._userWalletAddress.length - 4);
    }

    get userWalletAddress(): UserID | undefined {
        if (APP_ENV === 'prod' && getCurrentNetwork(true) !== 'starknet-mainnet')
            return undefined;
        return this._userWalletAddress;
    }

    get starknetIdDomain(): string {
        return this._starknetIdDomain;
    }

    get user_id(): UserID | undefined {
        if (!this._userWalletAddress || (APP_ENV === 'prod' && getCurrentNetwork(true) !== 'starknet-mainnet'))
            return undefined;
        return `${getCurrentNetwork(true)}/${this._userWalletAddress}`;
    }
}

export const walletStore = reactive(new WalletStore()) as unknown as WalletStore;
walletStore.init();
