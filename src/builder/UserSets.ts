import { backendManager } from '@/Backend';
import { blockchainProvider } from '@/chain/BlockchainProvider';
import contractStore from '@/chain/Contracts';
import { Notification } from '@/Notifications';
import { getBookletData } from './BookletData';
import { useGenesisStore } from './GenesisStore';
import { perUserStorable, perUserStore } from './PerUserStore';
import { SetData } from './SetData';


class UserSetStore implements perUserStorable {
    user_id!: string;
    _sets = [] as string[];
    // Only store metadata on sets where something is happening. Rest are assumed live.
    metadata = {} as { [setId: string]: {
        set_id: string,
        status: 'TENTATIVE' | 'TENTATIVE_DELETED',
        tx_hash: string,
    }};

    _setData = {} as { [setId: string]: {
            data: SetData,
            booklet: string | undefined,
        }
    };

    _serialize() {
        const setData = {} as UserSetStore['setData'];
        for (const setId in this._setData)
            setData[setId] = {
                data: this._setData[setId].data.serialize(),
                booklet: this._setData[setId].booklet,
            }
        return {
            sets: this._sets,
            metadata: this.metadata,
            setData: setData,
        }
    }

    _deserialize(data: any) {
        this._sets = data.sets;
        this.metadata = data.metadata;
        for (const setId in data.setData)
            this._setData[setId] = {
                data: new SetData(setId).deserialize(data.setData[setId].data),
                booklet: data.setData[setId].booklet,
            }
    }

    _init() {
        setTimeout(() => {
            this.poll();
        }, 500);
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
        try {
            this._sets = (await backendManager.fetch(`v1/user/sets/${this.user_id}`)).sets;
        } catch(ex) {
            console.error(ex);
        }
        const network = this.user_id.split('/')[0];
        for (const setId of this._sets)
            if (!this._setData[setId]) {
                const data = await backendManager.fetch(`v1/metadata/${network}/${setId}.json`);
                this._setData[setId] = {
                    data: new SetData(setId).deserialize(data),
                    booklet: data.booklet_id,
                }
            }

    }

    onEnter() {
        this.fetchData();
    }

    async mintSet(token_hint: string, data: any, image: string | undefined) {
        // Debug
        //downloadJSON(data, data.id + ".json")
        const TX = await contractStore.set!.assemble(
            this.user_id.split('/')[1],
            token_hint,
            data,
        );
        return this._mintSet(TX, data, image);
    }

    async mintBookletSet(token_hint: string, data: any, booklet: string) {
        // Debug
        //downloadJSON(data, data.id + ".json")
        const genesisStore = useGenesisStore();
        const image = fetch(genesisStore.coverBookletRoute(booklet));
        const bookletData = (await getBookletData(booklet));
        const TX = await contractStore.set!.assemble(
            this.user_id.split('/')[1],
            token_hint,
            bookletData.value, // pass the booklet data to make sure we have the proper shape layout
            bookletData.value.token_id,
        );

        const imageBlob = (await (await image).blob());
        const image_base64 = await new Promise(yes => {
            const reader = new FileReader() ;
            reader.onload = x => yes(x);
            reader.readAsDataURL(imageBlob);
        });
        return this._mintSet(TX, data, image_base64);
    }

    async _mintSet(TX: any, data: any, image: string | undefined, booklet?: string) {
        // Send a hint to the backend.
        backendManager.storeSet({
            chain_id: this.user_id.split('/')[0],
            owner: this.user_id.split('/')[1],
            token_id: data.id,
            data: data,
            image_base64: image,
        });

        this._setData[data.id] = {
            data: new SetData(data.id).deserialize(data),
            booklet: booklet,
        }
        this.metadata[data.id] = {
            set_id: data.id,
            status: 'TENTATIVE',
            tx_hash: TX.transaction_hash,
        }
        return TX;
    }

    async disassemble(token_id: string) {
        // TODO: find the booklet
        let booklet_token_id;
        if (this.setData[token_id].booklet)
            booklet_token_id = (await getBookletData(this.setData[token_id].booklet)).value.token_id;
        const TX = await contractStore.set!.disassemble(
            this.user_id.split('/')[1],
            token_id,
            this.setData[token_id].data,
            booklet_token_id,
        );
        this.metadata[token_id] = {
            set_id: token_id,
            status: 'TENTATIVE_DELETED',
            tx_hash: TX.transaction_hash,
        }
        return TX;
    }

    async poll() {
        await this.fetchData();
        for (const setId in this.metadata)
            if (this.metadata[setId].status === 'TENTATIVE' && this._sets.indexOf(setId) !== -1)  {
                this.notifyMintingConfirmed(this.metadata[setId]);
                delete this.metadata[setId];
            } else if (this.metadata[setId].status === 'TENTATIVE_DELETED' && this._sets.indexOf(setId) === -1)  {
                this.notifyDeletionConfirmed(this.metadata[setId]);
                delete this.metadata[setId];
            }
        // At this point, if there remains any we must check for failure.
        if (!Object.keys(this.metadata).length) {
            setTimeout(() => this.poll(), 30000)
            return;
        }
        for (const setId in this.metadata) {
            const item = this.metadata[setId];
            const status = await blockchainProvider.value?.getTransactionStatus(item.tx_hash);
            if (status === 'REJECTED') {
                if (item.status === 'TENTATIVE')
                    this.notifyMintingRejected(item);
                else if (item.status === 'TENTATIVE_DELETED')
                    this.notifyDeletionRejected(item);
                delete this.metadata[setId];
            }
        }
        setTimeout(() => this.poll(), 10000);
    }

    notifyMintingConfirmed(setData: UserSetStore['metadata']['any']) {
        new Notification({
            type: 'set_mint_confirmed',
            title: 'Set minted',
            level: 'success',
            data: {
                tx_hash: setData.tx_hash,
                set_id: setData.set_id,
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
            },
            read: false,
        }).push(true);
    }

    notifyMintingRejected(setData: UserSetStore['metadata']['any']) {
        new Notification({
            type: 'set_mint_rejected',
            title: 'Minting failure',
            level: 'error',
            data: {
                tx_hash: setData.tx_hash,
                set_id: setData.set_id,
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
            },
            read: false,
        }).push(true);
    }
}

export const userSetStore = perUserStore(UserSetStore);
userSetStore.setup();
