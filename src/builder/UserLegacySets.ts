import { backendManager } from '@/Backend';
import { Notification } from '@/Notifications';
import { chainBriqs } from './ChainBriqs';
import { perUserStorable, perUserStore } from './PerUserStore';
import { SetData } from './SetData';
import { maybeStore } from '@/chain/WalletLoading';
import { APP_ENV } from '@/Meta';
import { setsManager } from './SetsManager';
import type { ExternalSetData } from './ExternalSets';
import { getPremigrationNetwork } from '@/chain/Network';



class UserLegacySetStore implements perUserStorable {
    user_id!: string;
    _sets = [] as string[];
    // Only store metadata on sets where something is happening. Rest are assumed live.
    metadata = {} as { [setId: string]: {
        set_id: string,
        status: 'TENTATIVE' | 'TENTATIVE_DELETED',
        tx_hash: string,
    }};

    _status = 'FETCHING' as 'FETCHING' | 'LOADED' | 'ERROR';

    _setData = {} as { [setId: string]: Omit<ExternalSetData, 'data'> & { data?: SetData }
    };

    polling!: number;

    get status() {
        return this._status;
    }

    onEnter() {
        this.fetchData();
        this.polling = setTimeout(() => this.poll(), 5000);
    }

    onLeave() {
        if (this.polling)
            clearTimeout(this.polling);
    }

    _serialize() {
        const setData = {} as Record<string, Omit<ExternalSetData, 'data'> & { data?: SetData }>;
        for (const setId in this._setData)
            // For now only save data for temp sets, otherwise it's too heavy
            if (setId in this.metadata)
                setData[setId] = {
                    data: this._setData[setId].data!.serialize(),
                    booklet_id: this._setData[setId].booklet_id,
                    created_at: this._setData[setId].created_at,
                }
            else
                setData[setId] = {
                    booklet_id: this._setData[setId].booklet_id,
                    created_at: this._setData[setId].created_at,
                }
        // TODO: find a way to serialise set data maybe.
        return {
            sets: this._sets,
            metadata: JSON.parse(JSON.stringify(this.metadata)),
            setData: setData,
        }
    }

    _deserialize(data: any) {
        this._sets = data.sets;
        this.metadata = data.metadata;
        this._setData = {};
        for (const setId in data.setData)
            this._setData[setId] = {
                data: data.setData[setId].data ? new SetData(setId).deserialize(data.setData[setId].data) : undefined,
                booklet_id: data.setData[setId].booklet_id,
                created_at: data.setData[setId].created_at,
            }
    }

    _onStorageChange(data: any) {
        this._deserialize(data);
    }


    get sets() {
        const ret = this._sets.filter((setId: string) => this.metadata[setId]?.status !== 'TENTATIVE_DELETED');
        for (const setId in this.metadata) {
            const item = this.metadata[setId];
            if (item.status === 'TENTATIVE')
                ret.push(item.set_id);
        }
        return ret;
    }

    get setData() {
        return this._setData;
    }

    async fetchData() {
        let success = true;
        try {
            const [network, address] = this.user_id.split('/');
            const premigrationNetwork = getPremigrationNetwork(network);
            // Do nothing on non-legacy networks.
            if (!premigrationNetwork)
                return false;
            this._sets = (await backendManager.fetch(`v1/user/data/${premigrationNetwork}/${address}`, 5000)).sets;
            this._status = 'LOADED';
        } catch(ex) {
            console.error(ex.message);
            // If we were loading, we've already loaded once, so keep on trucking.
            if (this._status === 'FETCHING')
                this._status = 'ERROR';
            success = false;
        }
        // Clean up all hidden sets that we have succesfully minted
        // (this needs to be _sets or we'll delete temporary sets)
        for (const setId of this._sets) {
            const hiddenSet = setsManager.getHiddenSetInfo(setId);
            if (hiddenSet)
                setsManager.deleteLocalSet(hiddenSet.id);
        }
        // Tell the set manager to reveal any other hidden set that's old enough, to prevent data loss.
        setsManager.revealHiddenSetsMaybe();
        const network = getPremigrationNetwork(this.user_id.split('/')[0]);
        // Attempt to reload all active sets, including sets that we don't know for sure are minted
        // (there's a decent chance we'll get the metadata from the backend anyways).
        for (const setId of this.sets)
            if (!this._setData[setId]?.data)
                try {
                    const data = await backendManager.fetch(`v1/metadata/${network}/${setId}.json`);
                    this._setData[setId] = {
                        data: new SetData(setId).deserialize(data),
                        booklet_id: data.booklet_id,
                        created_at: data.created_at * 1000, // JS timestamps are milliseconds
                        properties: data.properties,
                        background_color: data.background_color,
                    }
                } catch(_) {
                    if (APP_ENV === 'dev')
                        console.error(_.message);
                    success = false;
                }
        return success;
    }

    async poll() {
        const success = await this.fetchData();
        const network = getPremigrationNetwork(this.user_id.split('/')[0]);
        if (!network)
            return;
        for (const setId in this.metadata)
            if (this.metadata[setId].status === 'TENTATIVE' && this._sets.indexOf(setId) !== -1)  {
                this.notifyMintingConfirmed(this.metadata[setId]);
                delete this.metadata[setId];
                // At this point re-fetch the data just in case we ended up with something un-clean.
                try {
                    backendManager.fetch(`v1/metadata/${network}/${setId}.json`).then(data => {
                        this._setData[setId] = {
                            data: new SetData(setId).deserialize(data),
                            booklet_id: data.booklet_id,
                            created_at: data.created_at * 1000,
                            properties: data.properties,
                            background_color: data.background_color,
                        }
                    });
                } catch(_)  {
                    if (APP_ENV === 'dev')
                        console.error(_);
                }
                // Reload briqs, we likely have an update.
                chainBriqs.value?.loadFromChain();
            } else if (this.metadata[setId].status === 'TENTATIVE_DELETED' && this._sets.indexOf(setId) === -1)  {
                this.notifyDeletionConfirmed(this.metadata[setId]);
                delete this.metadata[setId];
                // Reload briqs, we likely have an update.
                chainBriqs.value?.loadFromChain();
            }
        // At this point, if there remains any we must check for failure.
        if (!Object.keys(this.metadata).length) {
            setTimeout(() => this.poll(), 60000)
            return;
        }
        for (const setId in this.metadata) {
            const item = this.metadata[setId];
            const status = await maybeStore.value?.getProvider()?.getTransactionStatus(item.tx_hash);
            if (status === 'REJECTED') {
                if (item.status === 'TENTATIVE') {
                    // Reveal the set.
                    const info = setsManager.getHiddenSetInfo(item.set_id);
                    if (info)
                        info.onchainId = undefined;
                    this.notifyMintingRejected(item, info?.id);
                } else if (item.status === 'TENTATIVE_DELETED')
                    this.notifyDeletionRejected(item);
                delete this.metadata[setId];
            }
        }
        setTimeout(() => this.poll(), success ? 60000 : 60000);
    }

    notifyDeletionConfirmed(setData: UserSetStore['metadata']['any']) {
        new Notification({
            type: 'set_delete_confirmed',
            title: 'Set disassembled',
            level: 'success',
            data: {
                tx_hash: setData.tx_hash,
                set_id: setData.set_id,
                name: this.setData[setData.set_id]?.data?.name || `${setData.set_id.slice(0, 10)}...`,
                network: this.user_id.split('/')[0],
            },
            read: false,
        }).push(true);
    }

    notifyDeletionRejected(setData: UserSetStore['metadata']['any']) {
        new Notification({
            type: 'set_delete_rejected',
            title: 'Disassembly failure',
            level: 'error',
            data: {
                tx_hash: setData.tx_hash,
                set_id: setData.set_id,
                name: this.setData[setData.set_id]?.data?.name || `${setData.set_id.slice(0, 10)}...`,
                network: this.user_id.split('/')[0],
            },
            read: false,
        }).push(true);
    }
}

export const userLegacySetStore = perUserStore('UserLegacySetStore', UserLegacySetStore);
userLegacySetStore.setup();
