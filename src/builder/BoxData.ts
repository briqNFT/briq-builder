
import { useGenesisStore } from '@/builder/GenesisStore';
import { computed } from 'vue';

export type CARD_MODES = 'AUTO' | 'PRESALE' | 'SALE' | 'INVENTORY' | 'BID';

export function useBoxData(tokenName: string) {
    const genesisStore = useGenesisStore();

    const themeID = computed(() => tokenName.split('/')[0]);
    const themeData = computed(() => genesisStore.themedata[themeID.value]._data);

    const itemQuery = computed(() => genesisStore.metadata[tokenName]);
    const item = computed(() => itemQuery.value._data);
    const saleQuery = computed(() => genesisStore.saledata[tokenName]);
    const saledata = computed(() => saleQuery.value?._data);

    const getActualMode = (mode?: CARD_MODES) => computed(() => {
        if (mode !== 'AUTO')
            return mode;
        return 'SALE';
    });

    const durationLeft = computed(() => saledata.value?.durationLeft());

    return {
        genesisStore,
        themeID,
        themeData,
        itemQuery,
        item,
        saleQuery,
        saledata,
        getActualMode,
        durationLeft,
    }
}