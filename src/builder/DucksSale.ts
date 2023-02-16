import { backendManager } from '@/Backend';
import { Fetchable } from '@/DataFetching';
import { defaultDict } from '@/ReactiveDefaultDict';
import { reactive, ref } from 'vue';

const searchBar = ref<string>();
const sortOrder = ref('a_z');

export const useSearch = function() {
    return {
        searchBar,
        sortOrder,
    }
}

export const themeSetsDataStore = defaultDict((network: string) => {
    return defaultDict((theme: string) => {
        const ret = reactive(new Fetchable<Record<string, any>>());
        ret.fetch(() => backendManager.fetch(`v1/${network}/${theme}/all_sets_static_data`));
        return ret;
    });
});

export const themeSetsOwnerStore = defaultDict((network: string) => {
    return defaultDict((theme: string) => {
        const ret = reactive(new Fetchable<Record<string, any>>());
        ret.fetch(() => backendManager.fetch(`v1/${network}/${theme}/all_sets_dynamic_data`));
        // TODO: reload now and then ?
        return ret;
    });
});


//backendManager.fetch(`v1/${network}/${themeName.value}/all_sets_dynamic_data`);

