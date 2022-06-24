
import { useGenesisStore } from '@/builder/GenesisStore';
import { computed } from 'vue';

export type CARD_MODES = 'AUTO' | 'PRESALE' | 'SALE';

export function useBoxData(tokenName: string) {
    const genesisStore = useGenesisStore();

    const itemQuery = computed(() => genesisStore.metadata[tokenName]);
    const item = computed(() => itemQuery.value._data);
    const saledata = computed(() => genesisStore.saledata[tokenName]._data);

    const getActualMode = (mode?: CARD_MODES) => computed(() => {
        if (mode !== 'AUTO')
            return mode;
        return 'SALE';
    });

    const durationLeft = computed(() => saledata.value.sale_start + saledata.value.sale_duration - Date.now() / 1000);

    return {
        genesisStore,
        itemQuery,
        item,
        saledata,
        getActualMode,
        durationLeft,
    }
}