
import { useGenesisStore } from '@/builder/GenesisStore';
import { computed } from 'vue';
import { userBoxesStore } from './UserBoxes';

export type CARD_MODES = 'AUTO' | 'PRESALE' | 'SALE' | 'INVENTORY' | 'BID';

export function useBoxData(tokenName: string) {
    const genesisStore = useGenesisStore();

    const themeID = computed(() => tokenName.split('/')[0]);
    const themeData = computed(() => genesisStore.themedata[themeID.value]._data);

    const itemQuery = computed(() => genesisStore.metadata[tokenName]);
    const item = computed(() => itemQuery.value._data);
    const saleQuery = computed(() => genesisStore.saledata[tokenName]);
    const saledata = computed(() => saleQuery.value?._data);

    const description = computed(() => {
        if (!item.value?.description)
            return [];
        return item.value.description.split('\n\n');
    });

    const durationLeft = computed(() => saledata.value?.durationLeft());

    const nbOwned = computed(() => {
        return userBoxesStore.current?.availableBoxes?.filter(x => x === tokenName).length || 0;
    });

    const hasPendingActivity = computed(() => {
        return (userBoxesStore.current?.metadata?.[tokenName]?.updates.length ?? 0) > 0;
    });

    const isUnboxable = computed(() => {
        if (nbOwned.value === 0)
            return false;
        const metaActivity = userBoxesStore.current?.metadata[tokenName];
        if (!metaActivity || metaActivity.updates.length < nbOwned.value)
            return true;
        // At this point we'll have to check if any update is pending.
        // (we can ignore DELETING_SOON because those are removed from available boxes anyways)
        return metaActivity.updates.some(x => x.status === 'TENTATIVE_PENDING');
    })

    const getActualMode = (mode?: CARD_MODES) => computed(() => {
        if (mode !== 'AUTO')
            return mode;
        return saledata.value?.isLive() ? 'SALE' : 'PRESALE';
    });

    return {
        genesisStore,
        themeID,
        themeData,
        itemQuery,
        item,
        saleQuery,
        saledata,
        description,
        getActualMode,
        durationLeft,
        nbOwned,
        hasPendingActivity,
        isUnboxable,
    }
}