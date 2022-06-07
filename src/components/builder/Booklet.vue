<script setup lang="ts">
import { inputStore } from '@/builder/inputs/InputStore';
import { packPaletteChoice, palettesMgr } from '@/builder/Palette';
import type { SetData } from '@/builder/SetData';
import { CONF } from '@/Conf';
import { markRaw, onBeforeMount, ref, watchEffect } from 'vue';
import { useStore } from 'vuex';

import Slider from '../generic/Slider.vue';
import { pushModal } from '../Modals.vue';
import { useBooklet } from './BookletComposable';
import ExportSetBookletVue from './modals/ExportSetBooklet.vue';

const currentPage = ref(1)

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
                    console.log(CONF.defaultPalette);
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

const shapeIsValid = ref(false);

const store = useStore();
watchEffect(() => {
    if (!bookletData.value)
        return;
    const set = store.state.builderData.currentSet as SetData;
    set.briqs_;
    const currentBriqs = set.getAllBriqs();
    const targetBriqs = bookletData.value.briqs.slice();
    if (currentBriqs.length !== targetBriqs.length) {
        shapeIsValid.value = false;
        return;
    }
    let match = 0;
    for (const a of targetBriqs)
    {
        for (const b of currentBriqs)
        {
            if (a.pos[0] === b.position[0] && a.pos[1] === b.position[1] && a.pos[2] === b.position[2]
                 && a.data.color === b.color && a.data.material === b.material)
            {
                match++;
                break;
            }
        }
    }
    shapeIsValid.value = match === targetBriqs.length
})

const onMint = async () => {
    await pushModal(ExportSetBookletVue, { set: store.state.builderData.currentSet });
}

const { getImgSrc } = useBooklet();
</script>

<template>
    <div v-if="booklet" class="absolute top-0 bottom-0 right-0 pointer-events-none flex flex-col alternate-buttons m-4">
        <div class="grow basis-[6rem]"></div>
        <div class="pointer-events-auto bg-base rounded-md p-4 flex-col flex items-center gap-2">
            <template v-if="!!bookletData">
                <h2>{{ bookletData.name }}</h2>
                <p>Eye Hint</p>
                <img :src="getImgSrc(booklet, currentPage)">
                <p class="w-full"><Slider :min="1" :max="+bookletData.nb_pages || 1" v-model="currentPage"/></p>
                <Btn class="w-[10rem] my-1" :disabled="!shapeIsValid" @click="onMint">Mint</Btn>
            </template>
            <template v-else="">
                <p>Loading booklet data</p>
                <p><i class="fas fa-spinner animate-spin"/></p>
            </template>
        </div>
        <div class="grow basis-[6rem]"></div>
    </div>
</template>
