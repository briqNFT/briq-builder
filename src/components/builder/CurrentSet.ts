import { computed } from 'vue';
import { useStore } from 'vuex';

export function useCurrentSet() {
    const store = useStore();
    const currentSet = computed(() => store.state.builderData.currentSet);
    return { currentSet };
}
