import { inputStore } from '@/builder/inputs/InputStore';
import { packPaletteChoice, palettesMgr } from '@/builder/Palette';
import type { SetData } from '@/builder/SetData';
import { CONF } from '@/Conf';
import { markRaw, onBeforeMount, ref, watchEffect } from 'vue';
import { useStore } from 'vuex';

export function useBooklet() {
    const getImgSrc = (booklet: string, page: number) => `/${booklet}/step_${page - 1}.png`;

    const booklet = ref("");

    const bookletData = ref(null as any);

    onBeforeMount(() => {
        let data = window.localStorage.getItem('briq_current_booklet');
        if (!data)
            return;
        try {
            booklet.value = data;
            fetch(booklet.value + '/shape.json').then(
                async data => {
                    let metadata = await data.json();
                    bookletData.value = markRaw(metadata);
                    const palette = palettesMgr.getCurrent();
                    palette.reset(false);
                    for (const key in CONF.defaultPalette)
                        delete CONF.defaultPalette[key];
                    const colors = new Set();
                    for (const briq of metadata.briqs) {
                        CONF.defaultPalette[packPaletteChoice(briq.data.material, briq.data.color)] = briq.data.color;
                        colors.add(packPaletteChoice(briq.data.material, briq.data.color));
                    }
                    colors.forEach(col => palette.addChoice({ key: col }, col));
                    const choice = palette.getFirstChoice();
                    inputStore.currentColor = choice.color;
                    inputStore.currentMaterial = choice.material;
                }
            ).catch(() => {
                bookletData.value = undefined;
                window.localStorage.removeItem('briq_current_booklet');
            })
        } catch(e) {
            window.localStorage.removeItem('briq_current_booklet');
        }
    })

    const store = useStore();

    const shapeValidity = ref(0);

    watchEffect(() => {
        if (!bookletData.value)
            return;
        const set = store.state.builderData.currentSet as SetData;
        set.briqs_;
        const currentBriqs = set.getAllBriqs();
        const targetBriqs = bookletData.value.briqs.slice();
        let match = 0;
        for (const a of targetBriqs)
        {
            let found = false;
            for (let i = 0; i < currentBriqs.length; ++i)
            {
                const b = currentBriqs[i];
                if (a.pos[0] === b.position[0] && a.pos[1] === b.position[1] && a.pos[2] === b.position[2])
                {
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
        booklet,
        bookletData,
    };
};
