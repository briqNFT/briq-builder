import { computed } from 'vue';
import { useStore } from 'vuex'

export function useCurrentSet() {
    const currentSet = computed(() => useStore().state.builderData.currentSet);
    return { currentSet };
}
