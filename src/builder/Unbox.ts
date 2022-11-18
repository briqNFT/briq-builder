import contractStore from '@/chain/Contracts';
import { maybeStore, walletInitComplete } from '@/chain/WalletLoading';
import { Notification } from '@/Notifications';
import { chainBriqs } from './ChainBriqs';
import { useGenesisStore } from './GenesisStore';
import { setsManager } from './SetsManager';
import { userBookletsStore } from './UserBooklets';
import { userBoxesStore } from './UserBoxes';

export function useUnboxHelpers() {
    const genesisStore = useGenesisStore();
    const unbox = async function(box_id: string) {
        await walletInitComplete;

        const data = await genesisStore.metadata[box_id]._fetch;
        const TX = await contractStore.box?.unbox(maybeStore.value!.userWalletAddress, data.token_id);
        userBoxesStore.current!.hideOne(box_id, TX.transaction_hash);
        userBookletsStore.current!.showOne(box_id, TX.transaction_hash);
        chainBriqs.value!.show('0x1', data.nb_briqs, TX.transaction_hash);

        new Notification({
            type: 'box_unbox_started',
            title: 'Unboxing',
            level: 'info',
            data: {
                tx_hash: TX.transaction_hash,
                box_id: box_id,
            },
            read: true,
        }).push(true);
    }

    // For testing.
    const fakeUnbox = async function(box_id: string) {
        await walletInitComplete;

        const data = await genesisStore.metadata[box_id]._fetch;
        const TX = { transaction_hash: '0xcafe' }//await contractStore.box?.unbox(maybeStore.value!.userWalletAddress, data.token_id);
        userBoxesStore.current!.hideOne(box_id, TX.transaction_hash);
        userBookletsStore.current!.showOne(box_id, TX.transaction_hash);
        chainBriqs.value!.show('0x1', data.nb_briqs, TX.transaction_hash);
    }

    // Create a new local set with the proper booklet.
    // For convenience, this passes the relevant data as arguments.
    const createBookletSet = (booklet_id: string, name: string, description: string) => {
        const set = setsManager.createLocalSet();
        set.name = name;
        set.description = description;
        const info = setsManager.getInfo(set.id);
        info.booklet = booklet_id;
        return set.id
    }

    return {
        unbox,
        fakeUnbox,
        createBookletSet,
    }
}