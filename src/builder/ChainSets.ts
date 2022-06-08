import { reactive, toRef, watch, watchEffect } from 'vue';
import SetContract from '../chain/contracts/set';
import { logDebug, pushMessage } from '../Messages';

import { ignoreOutdated, isOutdated, ticketing } from '../Async';

class ChainSetInfo {
    setId!: string;

    // Manual garbage-collect when fetching
    _traced = true;

    init(setId: string) {
        this.setId = setId;
        return this;
    }
}

export class ChainSets {

    fetchingChainSets = false;
    lastOwner = '';

    sets = [] as string[];
    setData = {} as { [setId: string]: ChainSetInfo };

    // Empty on purpose - need to wait for reactivity enabling.
    constructor() {}

    init() {
        return this;
    }

    getSets = ticketing(async function (setContract: SetContract, owner: string) {
        return await setContract.balanceDetailsOf(owner);
    });

    async loadOnChain(setContract: SetContract, owner: string) {
        this.fetchingChainSets = true;
        logDebug('CHAIN SETS - LOADING FOR ', owner);
        try {
            this.lastOwner = owner;
            await ignoreOutdated(async () => {
                for (const setId in this.setData)
                    this.setData[setId]._traced = false;
                const chainSets = await this.getSets(setContract, owner);
                for (const setId of chainSets)
                    if (this.setData[setId])
                        this.setData[setId]._traced = true;
                    else {
                        this.setData[setId] = reactive(new ChainSetInfo()).init(setId);
                        this.sets.push(setId);
                    }

                for (const setId in this.setData)
                    if (!this.setData[setId]._traced) {
                        delete this.setData[setId];
                        this.sets.splice(this.sets.indexOf(setId), 1);
                    }
            });
        } catch (err) {
            if (err?.message === 'Network Error') {
                pushMessage('Error loading sets from chain - the connection to starknet timed out');
                console.error(err);
            } else {
                console.log(err);
                pushMessage('Error loading sets from chain - see console for details');
                reportError(err as Error);
            }
        }
        logDebug('CHAIN SETS - LOADED', this.sets);
        this.fetchingChainSets = false;
    }

    // TODO: move this elsewhere?
    watchForChain(contractStore: any, wallet: any) {
        watch(
            // Have to use refs because of auto-unwrapping.
            [toRef(contractStore, 'set'), toRef(wallet, 'userWalletAddress')],
            () => {
                // Remove all sets.
                for (const setId in this.setData)
                    if (!this.setData[setId]._traced)
                        delete this.setData[setId];
                this.sets.splice(0, this.sets.length);

                if (contractStore.set && wallet.userWalletAddress)
                    this.loadOnChain(contractStore.set, wallet.userWalletAddress);
            },
            {
                immediate: true,
            },
        );
    }
}

export const createChainSets = () => reactive(new ChainSets()).init();
