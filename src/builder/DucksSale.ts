import { backendManager } from '@/Backend';
import { Fetchable } from '@/DataFetching';
import { defaultDict } from '@/ReactiveDefaultDict';
import { reactive, ref } from 'vue';

const searchBar = ref<string>();
const sortOrder = ref('a_z');
const groupBy = ref(undefined as undefined | 'owner');

export const useSearch = function() {
    return {
        searchBar,
        sortOrder,
        groupBy,
    }
}

export const themeObjects = defaultDict((network: string) => {
    return defaultDict((theme: string) => {
        const ret = reactive(new Fetchable<Record<string, string>>());
        ret.fetch(() => backendManager.fetch(`v1/${network}/${theme}/object_ids`));
        return ret;
    });
});

export const themeSetsDataStore = defaultDict((network: string) => {
    return defaultDict((theme: string) => {
        const ret = reactive(new Fetchable<Record<string, any>>());
        ret.fetch(async () => {
            const data_by_set_id = await backendManager.fetch(`v1/${network}/${theme}/all_sets_static_data`)
            const mapping = {};
            for (const [key, value] of Object.entries(data_by_set_id))
                mapping[value['booklet_id']] = value;
            return mapping;
        });
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

