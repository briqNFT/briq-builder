
import { useGenesisStore } from '@/builder/GenesisStore';
import { computed } from 'vue';

export type CARD_MODES = 'AUTO' | 'PRESALE' | 'SALE' | 'INVENTORY';

export function useBoxData(tokenName: string) {
    const genesisStore = useGenesisStore();

    const itemQuery = computed(() => genesisStore.metadata[tokenName]);
    const item = computed(() => itemQuery.value._data);
    const saleQuery = computed(() => genesisStore.saledata[tokenName]);
    const saledata = computed(() => item.value._data);

    const getActualMode = (mode?: CARD_MODES) => computed(() => {
        if (mode !== 'AUTO')
            return mode;
        return 'SALE';
    });

    const durationLeft = computed(() => saledata.value?.sale_start + saledata.value?.sale_duration - Date.now() / 1000);

    return {
        genesisStore,
        itemQuery,
        item,
        saleQuery,
        saledata,
        getActualMode,
        durationLeft,
    }
}