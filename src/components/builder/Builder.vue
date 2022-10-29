<script setup lang="ts">
import WebGLCanvas from './WebGLCanvas.vue';
import MenuBar from './MenuBar.vue';
import SideBar from './SideBar.vue';
import Booklet from './Booklet.vue';

import { dispatchBuilderAction } from '@/builder/graphics/Dispatch';

import { onBeforeMount, provide, ref, toRef, watch } from 'vue';
import { featureFlags } from '@/FeatureFlags';
import { logDebug, pushMessage, setTooltip } from '../../Messages';
import { useBuilder } from '@/components/builder/BuilderComposable';
import { inputInitComplete } from '@/builder/inputs/InputLoading';

import { useRoute } from 'vue-router';
import { userSetStore } from '@/builder/UserSets';
import { SetData } from '@/builder/SetData';
import { backendManager } from '@/Backend';
import { getCurrentNetwork } from '@/chain/Network';

import { useBooklet } from './BookletComposable';
import { packPaletteChoice, palettesMgr, unpackPaletteChoice } from '@/builder/Palette';
import { inputStore } from '@/builder/inputs/InputStore';
import { getBookletData } from '@/builder/BookletData';
import { threeSetupComplete } from '@/threeLoading';
import { checkForInitialGMSet } from '@/builder/SetsManager';
import { useStore } from 'vuex';
import { APP_ENV } from '@/Meta';
import { setupInputMap } from '@/builder/inputs/InputMapPopulate';
import { walletInitComplete } from '@/chain/WalletLoading';

const { setsManager, chainBriqs, currentSet, selectSet, resetBuilderState } = useBuilder();

provide('chainBriqs', chainBriqs);
provide('messages', {
    pushMessage,
    setTooltip,
});
provide('featureFlags', featureFlags);

const route = useRoute();

const { booklet, bookletData } = useBooklet();

async function initializeStartSet() {
    if (route.query['set'])
        try {
            const setId = route.query['set'] as string;
            if (setsManager.getInfo(setId))
                await selectSet(setsManager.getInfo(setId).getSet());
            else if (userSetStore.current?.setData[setId])
                await selectSet(userSetStore.current.setData[setId].data);
            else {
                // This is likely to fail but we won't care too much.
                const data = new SetData(setId).deserialize(await backendManager.fetch(`v1/metadata/${getCurrentNetwork()}/${setId}.json`));
                await selectSet(data);
            }
        } catch(_) {
            if (APP_ENV === 'dev')
                console.error(_)
        }

    if (!currentSet.value) {
        logDebug(('BUILDER - INITIALIZING GM SET'));
        const set = checkForInitialGMSet();
        if (set)
            await selectSet(set);
    }

    // Must have a local set.
    if (!currentSet.value) {
        let set = setsManager.getLocalSet();
        if (!set)
            set = setsManager.createLocalSet();
        await selectSet(set);
    }

    logDebug('BUILDER - START SET INITIALIZED');
}

const store = useStore();

const initializePalette = async () => {
    if (booklet.value) {
        await getBookletData(booklet.value);

        const colors = [];
        let starter = undefined;
        for (const briq of bookletData.value.briqs) {
            colors.push([packPaletteChoice(briq.data.material, briq.data.color), briq.data.color]);
            if (briq.pos[1] === 0)
                starter = packPaletteChoice(briq.data.material, briq.data.color);
        }
        const THREE = (await threeSetupComplete);
        colors.sort((a, b) => {
            const ca = new THREE.Color(a[1]);
            const cb = new THREE.Color(b[1]);
            if (ca.r != cb.r)
                return ca.r - cb.r;
            if (ca.g != cb.g)
                return ca.g - cb.g;
            return ca.b - cb.b;
        });
        const palette = palettesMgr.getCurrent();
        palette.shouldSerialize = false;
        palette.reset(false);
        for (const key of colors)
            palette.addChoice({ key: key[0] }, key[1]);
        const choice = starter ? unpackPaletteChoice(starter) : palette.getFirstChoice();
        inputStore.currentColor = choice.color;
        inputStore.currentMaterial = choice.material;
        logDebug('PALETTE - SWITCHING TO BOOKLET')
    } else {
        const palette = palettesMgr.getCurrent();
        palette.deserialize();
        palette.shouldSerialize = true;
        logDebug('PALETTE - SWITCHING TO DEFAULT')
    }
}

const ready = ref(false);
onBeforeMount(async () => {
    setupInputMap();

    resetBuilderState();

    await inputInitComplete.value;

    await initializeStartSet();

    dispatchBuilderAction('select_set', currentSet.value);

    // Change default palette & update colors.
    await initializePalette();

    dispatchBuilderAction('put_all_in_view');

    // Reset history so we start fresh, because at this point other operations have polluted it.
    await store.dispatch('reset_history');

    await walletInitComplete;

    ready.value = true;
});

watch([toRef(route, 'query'), toRef(route.query, 'set')], async () => {
    if (!route.query.set)
        return;
    let set = setsManager.getInfo(route.query.set as string);
    await selectSet(set.getSet());

    dispatchBuilderAction('select_set', currentSet.value);

    // Change default palette & update colors.
    await initializePalette();

    dispatchBuilderAction('put_all_in_view');

    // Reset history so we start fresh, because at this point other operations have polluted it.
    await store.dispatch('reset_history');
}, {
    deep: true,
})
</script>

<template>
    <div class="fixed w-screen h-screen">
        <WebGLCanvas class="z-[-1]"/>
        <template v-if="ready">
            <MenuBar/>
            <Booklet/>
            <SideBar/>
        </template>
    </div>
</template>
