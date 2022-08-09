import { useStore } from 'vuex'

export function useCurrentSet() {
    const currentSet = useStore().state.builderData.currentSet;
    return { currentSet };
}
