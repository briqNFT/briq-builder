import type { SetData } from '@/builder/SetData';
import { markRaw, reactive, ref, toRef, watchEffect, watch, computed, Ref } from 'vue';
import { inputStore } from '@/builder/inputs/InputStore';
import { packPaletteChoice, palettesMgr } from '@/builder/Palette';
import { CONF } from '@/Conf';
import { useBuilder } from '@/components/builder/BuilderComposable';
import { getCurrentNetwork } from '@/chain/Network';
import { backendManager } from '@/Backend';
import { getStepImgSrc, BookletData, getBookletData } from '@/builder/BookletData';

export const bookletStore = reactive({
    minimized: false,
});

const OgPalette = Object.assign({}, CONF.defaultPalette);

export function useBooklet(forceSet?: Ref<SetData>, forceBooklet?: Ref<string>) {
    const { currentSet, currentSetInfo } = useBuilder();

    const booklet = computed(() => forceBooklet?.value || currentSetInfo.value.booklet);

    let bookletRef = ref<undefined | BookletData>(undefined);
    watch([currentSetInfo, forceSet, forceBooklet], () => {
        if (booklet.value)
            bookletRef = getBookletData(booklet.value);
        else
            bookletRef.value = undefined;
    }, { immediate: true });

    // Change default palette & update colors.
    watchEffect(() => {
        if (bookletRef.value) {
            for (const key in CONF.defaultPalette)
                delete CONF.defaultPalette[key];
            for (const briq of bookletRef.value.briqs)
                CONF.defaultPalette[packPaletteChoice(briq.data.material, briq.data.color)] = briq.data.color;

            const palette = palettesMgr.getCurrent();
            palette.reset(true);
            const choice = palette.getFirstChoice();
            inputStore.currentColor = choice.color;
            inputStore.currentMaterial = choice.material;
        } else {
            for (const key in CONF.defaultPalette)
                delete CONF.defaultPalette[key];
            Object.assign(CONF.defaultPalette, OgPalette);
        }
    });

    // Compute the progress
    const shapeValidity = ref(0);
    watchEffect(() => {
        if (!bookletRef.value) {
            shapeValidity.value = 0;
            return;
        }
        const set = forceSet?.value || currentSet.value as SetData;
        if (!set) {
            shapeValidity.value = 0;
            return;
        }
        set.briqs_;
        const currentBriqs = set.getAllBriqs();
        const targetBriqs = bookletRef.value.briqs.slice();

        const offset = [Infinity, Infinity, Infinity], offset2 = [Infinity, Infinity, Infinity];
        for (const briq of currentBriqs) {
            offset[0] = Math.min(offset[0], briq.position![0]);
            offset[1] = Math.min(offset[1], briq.position![1]);
            offset[2] = Math.min(offset[2], briq.position![2]);
        }
        for (const briq of targetBriqs) {
            offset2[0] = Math.min(offset2[0], briq.pos[0]);
            offset2[1] = Math.min(offset2[1], briq.pos[1]);
            offset2[2] = Math.min(offset2[2], briq.pos[2]);
        }
        let match = 0;
        for (const a of targetBriqs) {
            let found = false;
            for (let i = 0; i < currentBriqs.length; ++i) {
                const b = currentBriqs[i];
                if (a.pos[0] === b.position[0] - offset[0] + offset2[0] && a.pos[1] === b.position[1] - offset[1]  + offset2[1] && a.pos[2] === b.position[2] - offset[2] + offset2[2]) {
                    if (a.data.color === b.color && a.data.material === b.material)
                        match++;
                    else
                        match += 0.5;
                    found = true;
                    currentBriqs.splice(i, 1);
                    break;
                }
            }
        }
        match -= currentBriqs.length * 0.9;
        shapeValidity.value = Math.min(1, Math.max(0, match / targetBriqs.length));
    })

    return {
        minimized: toRef(bookletStore, 'minimized'),
        getStepImgSrc,
        shapeValidity,
        booklet,
        bookletData: bookletRef,
    };
}
