import type { SetData } from '@/builder/SetData';
import { markRaw, reactive, ref, toRef, watchEffect } from 'vue';
import { useStore } from 'vuex';


import { inputStore } from '@/builder/inputs/InputStore';
import { packPaletteChoice, palettesMgr } from '@/builder/Palette';
import { CONF } from '@/Conf';

export const bookletStore = reactive({
    booklet: '',
    bookletData: null as any,
});

export function loadBookletData() {
    if (!bookletStore.booklet)
        return;

    try {
        fetch(bookletStore.booklet + '/shape.json').then(
            async data => {
                const metadata = await data.json();
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
            },
        ).catch(() => {
            bookletStore.bookletData = undefined;
        })
    } catch(e) {
        console.warn(e);
    }
}

export function useBooklet() {
    const getImgSrc = (booklet: string, page: number) => `/${booklet}/step_${page - 1}.png`;

    const store = useStore();

    const shapeValidity = ref(0);

    watchEffect(() => {
        if (!bookletStore.bookletData)
            return;
        const set = store.state.builderData.currentSet as SetData;
        set.briqs_;
        const currentBriqs = set.getAllBriqs();
        const targetBriqs = bookletStore.bookletData.briqs.slice();
        let match = 0;
        for (const a of targetBriqs) {
            let found = false;
            for (let i = 0; i < currentBriqs.length; ++i) {
                const b = currentBriqs[i];
                if (a.pos[0] === b.position[0] && a.pos[1] === b.position[1] && a.pos[2] === b.position[2]) {
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
        getImgSrc,
        shapeValidity,
        booklet: toRef(bookletStore, 'booklet'),
        bookletData: toRef(bookletStore, 'bookletData'),
    };
}
