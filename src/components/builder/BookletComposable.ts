import type { SetData } from '@/builder/SetData';
import { markRaw, reactive, ref, toRef, watchEffect, watch, computed } from 'vue';
import { inputStore } from '@/builder/inputs/InputStore';
import { packPaletteChoice, palettesMgr } from '@/builder/Palette';
import { CONF } from '@/Conf';
import { useBuilder } from '@/components/builder/BuilderComposable';
import { getCurrentNetwork } from '@/chain/Network';
import { backendManager } from '@/Backend';

export const bookletStore = reactive({
    bookletData: null as any,
    minimized: false,
});


const OgPalette = Object.assign({}, CONF.defaultPalette);

async function loadBookletData(booklet: string) {
    if (!booklet)
        return;

    try {
        const metadata = await backendManager.fetch(`v1/box/data/${getCurrentNetwork()}/${booklet}.json`)
        bookletStore.bookletData = markRaw(metadata);

        // Change default palette & update colors.
        for (const key in CONF.defaultPalette)
            delete CONF.defaultPalette[key];
        for (const briq of metadata.briqs)
            CONF.defaultPalette[packPaletteChoice(briq.data.material, briq.data.color)] = briq.data.color;

        const palette = palettesMgr.getCurrent();
        palette.reset(true);
        const choice = palette.getFirstChoice();
        inputStore.currentColor = choice.color;
        inputStore.currentMaterial = choice.material;
    } catch(e) {
        bookletStore.bookletData = undefined;
        console.warn(e);
    }
}

export function useBooklet() {
    const getImgSrc = (booklet: string, page: number) => `${backendManager.url}/v1/box/step_image/${getCurrentNetwork()}/${booklet}/${page - 1}.png`;

    const shapeValidity = ref(0);

    const { currentSet, currentSetInfo } = useBuilder();
    const booklet = computed(() => currentSetInfo.value.booklet);
    watch(currentSetInfo, () => {
        if (currentSetInfo.value && currentSetInfo.value.booklet)
            loadBookletData(currentSetInfo.value.booklet);
        else {
            for (const key in CONF.defaultPalette)
                delete CONF.defaultPalette[key];
            Object.assign(CONF.defaultPalette, OgPalette);
        }
    }, {
        immediate: true,
    });

    watchEffect(() => {
        if (!bookletStore.bookletData)
            return;
        const set = currentSet.value as SetData;
        set.briqs_;
        const currentBriqs = set.getAllBriqs();
        const targetBriqs = bookletStore.bookletData.briqs.slice();

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
        getImgSrc,
        shapeValidity,
        booklet,
        bookletData: toRef(bookletStore, 'bookletData'),
    };
}
