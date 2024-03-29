import { builderInputFsm } from '@/builder/inputs/BuilderInput';
import { inputStore } from '@/builder/inputs/InputStore';
import { computed, toRef } from 'vue';

export function useBuilderInput() {
    const activeInputButton = computed(() => ({
        place: 'place',
        place_multi: 'place',
        place_nft: 'place',
        paint: 'paint',
        paint_multi: 'paint',
        erase: 'erase',
        erase_multi: 'erase',
        inspect: 'select',
        inspect_va: 'select',
        inspect_box: 'select',
        drag: 'select',
        rotate: 'select',
        copy_paste: 'select',
        camera: 'camera',
        camera_select: 'camera',
    })[inputStore.currentInput] as 'place' | 'paint' | 'erase' | 'select' | 'camera' | undefined);

    const switchToState = (state: string, data?: any) => {
        builderInputFsm.switchTo(state, data);
    }
    return {
        inputStore,
        currentInput: toRef(inputStore, 'currentInput'),
        activeInputButton,
        switchToState,
        fsm: builderInputFsm.gui,
    }
}