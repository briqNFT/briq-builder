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
import { bookletDataStore } from '@/builder/BookletData';
import { threeSetupComplete } from '@/threeLoading';
import { checkForInitialGMSet } from '@/builder/SetsManager';
import { APP_ENV } from '@/Meta';
import { setupInputMap } from '@/builder/inputs/InputMapPopulate';
import { walletInitComplete } from '@/chain/WalletLoading';
import { builderHistory } from '@/builder/BuilderHistory';
import { hexUuid } from '@/Uuid';
import XplorerBanner from './XplorerBanner.vue';

const { setsManager, chainBriqs, currentSet, currentSetInfo, selectSet, resetBuilderState } = useBuilder();

provide('chainBriqs', chainBriqs);
provide('messages', {
    pushMessage,
    setTooltip,
});
provide('featureFlags', featureFlags);

const route = useRoute();

const { booklet, bookletFetch, bookletData } = useBooklet();

const createXplorerSet = async () => {
    if (!currentSet.value || currentSetInfo.value.booklet !== 'tutorial/Xplorer') {
        const set = setsManager.getBookletSet('tutorial/Xplorer');
        if (set)
            await selectSet(set);
        else {
            const set = new SetData(hexUuid());
            set.name = 'Argent Xplorer';
            set.description = 'A proud Xplorer venturing into the unknown of the Starknet universe!';
            const info = setsManager.registerLocalSet(set);
            info.booklet = 'tutorial/Xplorer';
            logDebug('BUILDER - creating Xplorer set');
            await selectSet(info.setData);
        }
    }
}

async function initializeStartSet() {
    if (route.query['set'])
        try {
            logDebug('BUILDER - attempting to load set ' + route.query['set']);
            const setId = route.query['set'] as string;
            const info = setsManager.getInfo(setId);
            if (info && !info.onchainId)
                await selectSet(info.getSet());
            else if (userSetStore.current?.setData[setId]?.data)
                await selectSet(userSetStore.current.setData[setId].data);
            else {
                // This is likely to fail but we won't care too much.
                const data = new SetData(setId).deserialize(await backendManager.fetch(`v1/metadata/${getCurrentNetwork()}/${setId}.json`));
                await selectSet(data);
            }
        } catch(_) {
            if (APP_ENV === 'dev')
                console.error(_)
            logDebug('BUILDER - failed to load specified set');
        }

    if (!currentSet.value) {
        const set = checkForInitialGMSet();
        if (set)
            await selectSet(set);
    }

    // Must have a local set.
    if (!currentSet.value) {
        logDebug('BUILDER - No set specified/found, loading non-specified local set');
        let set = setsManager.getLocalSet();
        if (!set)
            set = setsManager.createLocalSet();
        await selectSet(set);
    }

    logDebug('BUILDER - START SET INITIALIZED');
}

const initializePalette = async () => {
    if (booklet.value) {
        await bookletFetch.value!._fetch;

        const colors = [];
        let starter = undefined;
        // Use the fetch in case the computed data isn't up-to-date here.
        // TODO: improve on this.
        for (const briq of bookletFetch.value!._data!.briqs) {
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
    builderHistory.resetHistory();

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
    builderHistory.resetHistory();
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
