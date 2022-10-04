import contractStore from '@/chain/Contracts';
import { maybeStore, walletInitComplete } from '@/chain/WalletLoading';
import { useSetHelpers } from '@/components/builder/SetComposable';
import { useGenesisStore } from './GenesisStore';
import { setsManager } from './SetsManager';
import { userBoxesStore } from './UserBoxes';

export function useUnboxHelpers() {
    const genesisStore = useGenesisStore();
    const { openSetInBuilder } = useSetHelpers();
    const unbox = async function(box_id: string) {
        await walletInitComplete;

        const data = await genesisStore.metadata[box_id]._fetch;
        const TX = await contractStore.box?.unbox(maybeStore.value!.userWalletAddress, data.token_id);
        userBoxesStore.current?.hideOne(box_id, TX.transaction_hash);
        openSetInBuilder(createBookletSet(data!.name, box_id));
    }

    const createBookletSet = (set_name: string, booklet_id: string) => {
        // Create a new local set with the proper booklet.

        const set = setsManager.createLocalSet();
        set.name = set_name;
        const info = setsManager.getInfo(set.id);
        info.booklet = booklet_id;
        return set.id
    }
    return {
        unbox,
        createBookletSet,
    }
}