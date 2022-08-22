import { backendManager } from '@/Backend';
import { blockchainProvider } from '@/chain/BlockchainProvider';
import contractStore from '@/chain/Contracts';
import { getCurrentNetwork } from '@/chain/Network';
import { maybeStore, walletInitComplete } from '@/chain/WalletLoading';
import { Notification } from '@/Notifications';
import { perUserStorable, perUserStore } from './PerUserStore';
import { SetData } from './SetData';


class UserSetStore implements perUserStorable {
    _sets = [] as string[];
    // Only store metadata on sets where something is happening. Rest are assumed live.
    metadata = {} as { [setId: string]: {
        set_id: string,
        status: 'TENTATIVE' | 'TENTATIVE_DELETED',
        tx_hash: string,
    }};

    _setData = {} as { [setId: string]: SetData };

    _serialize() {
        const setData = {} as UserSetStore['setData'];
        for (const setId in this._setData)
            setData[setId] = this._setData[setId].serialize();
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
            this._setData[setId] = new SetData(setId).deserialize(data.setData[setId]);
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
        await walletInitComplete;
        try {
            this._sets = (await backendManager.fetch(`v1/user/sets/${getCurrentNetwork()}/${maybeStore.value!.userWalletAddress}`)).sets;
        } catch(ex) {
            console.error(ex);
        }
        for (const setId of this._sets)
            if (!this._setData[setId])
                this._setData[setId] = new SetData(setId).deserialize(await backendManager.fetch(`v1/metadata/${getCurrentNetwork()}/${setId}.json`));

    }

    onEnter() {
        this.fetchData();
    }

    async mintSet(token_hint: string, data: any, image: string | undefined) {
        // Debug
        //downloadJSON(data, data.id + ".json")
        const TX = await contractStore.set!.assemble(
            maybeStore.value!.userWalletAddress,
            token_hint,
            data.briqs.map((x: any) => x.data),
            // Point to the 'permanent' API. TODO: IFPS?
            'https://api.briq.construction/' + backendManager.getMetadataRoute(data.id),
        );

        // Send a hint to the backend.
        backendManager.storeSet({
            owner: maybeStore.value!.userWalletAddress,
            token_id: data.id,
            chain_id: getCurrentNetwork(),
            data: data,
            image_base64: image,
        });

        this._setData[data.id] = new SetData(data.id).deserialize(data);
        this.metadata[data.id] = {
            set_id: data.id,
            status: 'TENTATIVE',
            tx_hash: TX.transaction_hash,
        }
        return TX;
    }

    async disassemble(token_id: string) {
        const TX = await contractStore.set!.disassemble(
            maybeStore.value!.userWalletAddress,
            token_id,
            this.setData[token_id],
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
