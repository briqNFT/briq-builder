import { watchEffect, markRaw } from 'vue'

import { AccountInterface, Provider } from 'starknet';

import { logDebug, logDebugDelay } from '../Messages'
import { noParallel, ticketing } from '../Async';

import ManualWallet from './wallets/ManualWallet'
import ArgentXWallet, { getStarknetObject } from './wallets/ArgentX'
import MetamaskWallet from './wallets/Metamask'
import { IWallet } from './wallets/IWallet';

import { watchSignerChanges } from '@/chain/Contracts';

import { legacySetsMgr } from '../components/builder/set_browser/LegacySetsMgr';

import { setWalletInitComplete, walletInitComplete } from './WalletLoading';

import { reactive } from 'vue';
import { chooseDefaultNetwork, getCurrentNetwork, setNetwork } from './Network';

class WalletStore
{
    signer: undefined | AccountInterface = undefined;
    userWalletAddress = "";

    // Empty, because at this point we aren't a proxy to a reactive object.
    constructor() {}

    async initialize()
    {
        let storedAddress = window.localStorage.getItem("user_address");
        logDebugDelay(() => ["STARTING WALLET CONNECT", storedAddress]);

        await this.tryEnablingWalletSilently(storedAddress);

        // If we failed, try again once we've loaded the object, just in case we arrived here too quickly.
        if (!this.signer)
            getStarknetObject().then(() => {
                if (!this.signer)
                    this.tryEnablingWalletSilently(storedAddress);
            }).catch(() => logDebug("Argent appears unavailable"));

        // Mark the promise as complete - we've either succeeded at connecting or we don't have a default wallet/some other issue.
        setWalletInitComplete();

        watchSignerChanges(this);

        watchEffect(() => {
            // TODO: switch to IDB
            logDebug("Writing address ", this.userWalletAddress);
            window.localStorage.setItem("user_address", this.userWalletAddress);
        });
    }

    _tryEnablingWalletSilently = ticketing(async function(data: string) {
        // For now the only available wallet is Argent.
        let argx = new ArgentXWallet();
        let address = data;
        // Explicit disconnect.
        if (address === "")
            return;
        if (argx.isLikelyAvailable() && (argx.canEnableSilently() || address))
            this.enableWallet();
    });

    tryEnablingWalletSilently(data: string) {
        return this._tryEnablingWalletSilently.call(this, data);
    }

    _enableWallet = noParallel(async function() {
        // For now the only available wallet is Argent.
        let argx = new ArgentXWallet();
        logDebug("ARGENT-X AVAILABILITY:", argx.isLikelyAvailable());
        if (argx.isLikelyAvailable())
        {
            try
            {
                let [addr, provider, signer] = await argx.enable();
                logDebug("ARGENT-X ENABLED:", addr, provider, signer);

                this.setSigner({ provider: markRaw(provider), signer: markRaw(signer), addr });
                this.setProviderFromSigner();
                argx.watchForChanges(async () => {
                    // Disconnect first to reset addresses.
                    await this.disconnect();
                    await this.enableWallet();
                })
                return true;
            }
            catch(err)
            {
                console.warn(err);
            }
        }
        return false;
    });

    enableWallet() {
        return this._enableWallet.call(this);
    }

    setSigner(data: { provider: Provider, signer: AccountInterface, addr: string })
    {
        this.signer = data.signer;
        this.userWalletAddress = data.addr;
        legacySetsMgr.setup(this);
    }

    disconnect() {
        this.signer = undefined;
        this.userWalletAddress = "";
        legacySetsMgr.setup(this);
    }

    // TODO: might want to split the signer network from the provider network?
    getNetwork() {
        return getCurrentNetwork();
    }

    setProviderFromSigner() {
        if (!this.signer)
            chooseDefaultNetwork();
        else if (this.signer.gatewayUrl.indexOf("alpha-mainnet.starknet") !== -1)
            setNetwork("starknet-mainnet");
        else if (this.signer.gatewayUrl.indexOf("alpha4.starknet") !== -1)
            setNetwork("starknet-testnet");
    }
}

export const walletStore2 = reactive(new WalletStore());
walletStore2.initialize();

export function getPotentialWallets(): { [key: string]: { name: string, handler: new () => IWallet }}
{
    return {
        "manual": {
            "name": "Manual",
            "handler": ManualWallet
        },
        "argentx": {
            "name": "Argent-X",
            "handler": ArgentXWallet
        },
        "metamask": {
            "name": "Metamask",
            "handler": MetamaskWallet
        }
    }
}
