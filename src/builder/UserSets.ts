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
import { migrateBriqsIfNeeded } from '@/chain/contracts/migration';
import { GeneralizedUserItem } from './UserItem';



class UserSetStore extends GeneralizedUserItem {
    _setData = {} as { [setId: string]: Omit<ExternalSetData, 'data'> & { data?: SetData }
    };

    polling!: number;

    onEnter() {
        super.onEnter();
        /*
        this.metadata['0x1800000004'] = {
            token_name: '0x1800000004',
            updates: [{
                tx_hash: '0xcafe',
                block: undefined,
                status: 'TENTATIVE_PENDING',
                date: Date.now(),
            },
            {
                tx_hash: '0xcafe',
                block: undefined,
                status: 'TENTATIVE',
                date: Date.now(),
            },
            {
                tx_hash: '0xcafe',
                block: undefined,
                status: 'DELETING_SOON',
                date: Date.now(),
            },
            {
                tx_hash: '0xcafe',
                block: undefined,
                status: 'DELETING_SOON',
                date: Date.now(),
            },
        ],
        }*/
        this.polling = setTimeout(() => this._fetchData(), 20000);
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
            version: '2',
            sets: this._tokenNames,
            metadata: JSON.parse(JSON.stringify(this.metadata)),
            setData: setData,
        }
    }

    _deserialize(data: any) {
        if (!('version' in data) || data.version !== '2')
            return;
        this._tokenNames = data.sets;
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
        return this._tokenNames;
    }

    get setData() {
        return this._setData;
    }

    async fetchData() {
        const data = (await backendManager.fetch(`v1/user/data/${this.user_id}`, 5000));
        return {
            lastBlock: data.last_block,
            data: data.sets,
        }
    }

    async _fetchData() {
        try {
            this._lastDataFetch = await this.fetchData();
            this._updateData(this._lastDataFetch);
        } catch(ex) {
            console.error(ex.message);
        }

        // Clean up all hidden sets that we have succesfully minted
        // (this needs to be _sets or we'll delete temporary sets)
        for (const setId of this.sets) {
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
                        console.error(_.message);
                }
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
            this.showOne(data.id, TX.transaction_hash);
            window.removeEventListener('beforeunload', this.beforeUnloadTxPendingWarning);
            // Wait on the backend to be done before returning.
            await new Promise<void>(resolve => {
                // Don't fail on this - we probably want to proceed anyways as the blockchain TX is gone through.
                // (and we will either recover from on-chain data or fail anyways).
                backendHint.then(() => resolve()).catch(err => {
                    console.error('Error while sending data to backend - proceeding anyways', err);
                    resolve();
                });
                setTimeout(resolve, 5000);
            });
            return TX;
        } catch(_) {
            window.removeEventListener('beforeunload', this.beforeUnloadTxPendingWarning);
            throw _;
        }
    }

    /**
     * This function looks weird - it's a hack, it works, it's fine.
     */
    async migrateSet(old_network: string, old_token_id: string, new_network: string, data: any) {
        // Ask the backend to migrate the set
        await backendManager.post('v1/migrate_set', {
            old_chain_id: old_network,
            old_token_id: old_token_id,
            chain_id: new_network,
            token_id: data.id,
        });
        return (tx_hash: string) => {
            this._setData[data.id] = {
                data: new SetData(data.id).deserialize(data),
                booklet_id: undefined,
                created_at: Date.now(),
            }
            this.showOne(data.id, tx_hash);
        }
    }

    async disassemble(token_ids: string[]) {
        const [network, wallet_address] = this.user_id.split('/');
        const calls = [];
        for (const token_id of token_ids) {
            let booklet_token_id;
            if (this.setData[token_id].booklet_id)
                booklet_token_id = (await bookletDataStore[network][this.setData[token_id].booklet_id!]._fetch)!.token_id;

            calls.push(contractStore.set!.prepareDisassemble(
                wallet_address,
                token_id,
                this.setData[token_id].data!,
                booklet_token_id,
            ));
        }

        const TX = await maybeStore.value!.sendTransaction(migrateBriqsIfNeeded(calls));

        for (const token_id of token_ids) {
            if (this.setData[token_id].booklet_id)
                userBookletsStore.current!.showOne(this.setData[token_id].booklet_id!, TX.transaction_hash);

            for (const mat in this.setData[token_id].data!.usedByMaterial)
                chainBriqs.value?.show(mat, this.setData[token_id].data!.usedByMaterial[mat], TX.transaction_hash);

            this.hideOne(token_id, TX.transaction_hash);
        }
        return TX;
    }

    notifyMintConfirmed(item: { tx_hash: string, token_name: string }) {
        new Notification({
            type: 'set_mint_confirmed',
            title: 'Set minted',
            level: 'success',
            data: {
                tx_hash: item.tx_hash,
                set_id: item.token_name,
                name: this.setData[item.token_name]?.data?.name || `${item.token_name.slice(0, 10)}...`,
                network: this.user_id.split('/')[0],
            },
            read: false,
        }).push(true);
    }

    notifyMintFailure(item: { tx_hash: string, token_name: string }) {
        // Reveal the set.
        const info = setsManager.getHiddenSetInfo(item.token_name);
        if (info)
            info.onchainId = undefined;
        new Notification({
            type: 'set_mint_rejected',
            title: 'Set failed to mint',
            level: 'error',
            data: {
                tx_hash: item.tx_hash,
                set_id: item.token_name,
                name: this.setData[item.token_name]?.data?.name || `${item.token_name.slice(0, 10)}...`,
                network: this.user_id.split('/')[0],
                local_set_restored: !!info?.id,
            },
            read: false,
        }).push(true);
    }

    notifyBurnConfirmed(item: { tx_hash: string, token_name: string }) {
        new Notification({
            type: 'set_delete_confirmed',
            title: 'Set disassembled',
            level: 'success',
            data: {
                tx_hash: item.tx_hash,
                set_id: item.token_name,
                name: this.setData[item.token_name]?.data?.name || `${item.token_name.slice(0, 10)}...`,
                network: this.user_id.split('/')[0],
            },
            read: false,
        }).push(true);
    }

    notifyBurnFailure(item: { tx_hash: string, token_name: string }) {
        new Notification({
            type: 'set_delete_rejected',
            title: 'Disassembly failure',
            level: 'error',
            data: {
                tx_hash: item.tx_hash,
                set_id: item.token_name,
                name: this.setData[item.token_name]?.data?.name || `${item.token_name.slice(0, 10)}...`,
                network: this.user_id.split('/')[0],
            },
            read: false,
        }).push(true);
    }
}

export const userSetStore = perUserStore('UserSetStore', UserSetStore);
userSetStore.setup();
