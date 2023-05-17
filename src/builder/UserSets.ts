import { backendManager } from '@/Backend';
import contractStore from '@/chain/Contracts';
import { Notification } from '@/Notifications';
import { bookletDataStore } from './BookletData';
import { chainBriqs } from './ChainBriqs';
import { useGenesisStore } from './GenesisStore';
import { perUserStorable, perUserStore } from './PerUserStore';
import { SetData } from './SetData';
import { userBookletsStore } from './UserBooklets';
import { maybeStore } from '@/chain/WalletLoading';
import { APP_ENV } from '@/Meta';
import { setsManager } from './SetsManager';
import type { ExternalSetData } from './ExternalSets';
import type { Call } from 'starknet';



class UserSetStore implements perUserStorable {
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
            this._sets = (await backendManager.fetch(`v1/user/data/${this.user_id}`)).sets;
            this._status = 'LOADED';
        } catch(ex) {
            console.error(ex);
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
        const network = this.user_id.split('/')[0];
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
                        console.error(_);
                    success = false;
                }
        return success;
    }

    async poll() {
        const success = await this.fetchData();
        const network = this.user_id.split('/')[0];
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
            setTimeout(() => this.poll(), 30000)
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
        setTimeout(() => this.poll(), success ? 10000 : 60000);
    }

    async mintSet(otherCalls: Array<Call>, token_hint: string, data: any, image: string | undefined) {
        // Debug
        //downloadJSON(data, data.id + ".json")
        const TX = contractStore.set!.callAndAssemble(otherCalls,
            this.user_id.split('/')[1],
            token_hint,
            data,
        );
        return this._mintSet(TX, data, image);
    }

    async mintBookletSet(otherCalls: Array<Call>, token_hint: string, data: any, image: string, booklet: string) {
        // Debug
        //downloadJSON(data, data.id + ".json")
        const genesisStore = useGenesisStore();
        const [network, wallet_address] = this.user_id.split('/');
        const bookletData = await bookletDataStore[network][booklet]._fetch!;
        data.name = bookletData.name;
        data.descriptioon = bookletData.description;
        const TX = contractStore.set!.callAndAssemble(otherCalls,
            wallet_address,
            token_hint,
            data,
            bookletData.token_id,
        );
        if (!image) {
            // https://www.hacksoft.io/blog/handle-images-cors-error-in-chrome#solution
            const bookletImage = fetch(genesisStore.coverItemRoute(booklet) + '?no-cache-please');
            const imageBlob = (await (await bookletImage).blob());
            const image_base64 = await new Promise(yes => {
                const reader = new FileReader() ;
                reader.onload = _ => reader.result && yes(reader.result);
                reader.readAsDataURL(imageBlob);
            });
            image = image_base64 as string;
        }
        return this._mintSet(TX, data, image, booklet);
    }

    beforeUnloadTxPendingWarning(event: BeforeUnloadEvent) {
        event.preventDefault();
        event.returnValue = 'alert';
    }

    async _mintSet(TXp: Promise<any>, data: any, image: string | undefined, booklet?: string) {
        window.addEventListener('beforeunload', this.beforeUnloadTxPendingWarning);
        const [network, wallet_address] = this.user_id.split('/');
        try {
            // Send a hint to the backend
            const backendHint = backendManager.storeSet({
                chain_id: network,
                owner: wallet_address,
                token_id: data.id,
                data: data,
                image_base64: image,
            });

            const TX = await TXp;
            if (booklet)
                userBookletsStore.current!.hideOne(booklet, TX.transaction_hash);
            const materials = {};
            for (const briq of data.briqs) {
                if (!materials[briq.data.material])
                    materials[briq.data.material] = 0;
                ++materials[briq.data.material];
            }
            for (const mat in materials)
                chainBriqs.value?.hide(mat, materials[mat], TX.transaction_hash);

            this._setData[data.id] = {
                data: new SetData(data.id).deserialize(data),
                booklet_id: booklet,
                created_at: Date.now(),
            }
            this.metadata[data.id] = {
                set_id: data.id,
                status: 'TENTATIVE',
                tx_hash: TX.transaction_hash,
            }
            window.removeEventListener('beforeunload', this.beforeUnloadTxPendingWarning);
            // Wait on the backend to be done before returning.
            await new Promise<void>(resolve => {
                // Don't fail on this - we probably want to proceed anyways as the blockchain TX is gone through.
                backendHint.then(() => resolve()).catch(() => resolve());
                setTimeout(resolve, 5000);
            });
            return TX;
        } catch(_) {
            window.removeEventListener('beforeunload', this.beforeUnloadTxPendingWarning);
            throw _;
        }
    }

    async disassemble(token_id: string) {
        let booklet_token_id;
        const [network, wallet_address] = this.user_id.split('/');
        if (this.setData[token_id].booklet_id)
            booklet_token_id = (await bookletDataStore[network][this.setData[token_id].booklet_id!]._fetch)!.token_id;
        const TX = await contractStore.set!.disassemble(
            wallet_address,
            token_id,
            this.setData[token_id].data!,
            booklet_token_id,
        );

        if (this.setData[token_id].booklet_id)
            userBookletsStore.current!.showOne(this.setData[token_id].booklet_id!, TX.transaction_hash);

        for (const mat in this.setData[token_id].data!.usedByMaterial)
            chainBriqs.value?.show(mat, this.setData[token_id].data!.usedByMaterial[mat], TX.transaction_hash);

        this.metadata[token_id] = {
            set_id: token_id,
            status: 'TENTATIVE_DELETED',
            tx_hash: TX.transaction_hash,
        }
        return TX;
    }

    notifyMintingConfirmed(setData: UserSetStore['metadata']['any']) {
        new Notification({
            type: 'set_mint_confirmed',
            title: 'Set minted',
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

    notifyMintingRejected(setData: UserSetStore['metadata']['any'], localSetRestored?: string) {
        new Notification({
            type: 'set_mint_rejected',
            title: 'Set failed to mint',
            level: 'error',
            data: {
                tx_hash: setData.tx_hash,
                set_id: setData.set_id,
                name: this.setData[setData.set_id]?.data?.name || `${setData.set_id.slice(0, 10)}...`,
                network: this.user_id.split('/')[0],
                local_set_restored: localSetRestored,
            },
            read: false,
        }).push(true);
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

export const userSetStore = perUserStore('UserSetStore', UserSetStore);
userSetStore.setup();
