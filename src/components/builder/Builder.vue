<script setup lang="ts">
import WebGLCanvas from './WebGLCanvas.vue';
import MenuBar from './MenuBar.vue';
import SideBar from './SideBar.vue';
import Modals from '../Modals.vue';
import Messages from '../Messages.vue';
import Booklet from './Booklet.vue';

import CursorTooltip from '../generic/CursorTooltip.vue';

import { dispatchBuilderAction } from '@/builder/graphics/Dispatch';

import { onMounted, provide } from 'vue';
import { featureFlags } from '@/FeatureFlags';
import { logDebug, pushMessage, setTooltip } from '../../Messages';
import { useBuilder } from '@/components/builder/BuilderComposable';
import { builderInputFsm } from '@/builder/inputs/BuilderInput';
import { inputInitComplete } from '@/builder/inputs/InputLoading';

import { useRoute, useRouter } from 'vue-router';
import { userSetStore } from '@/builder/UserSets';
import { SetData } from '@/builder/SetData';
import { backendManager } from '@/Backend';
import { getCurrentNetwork } from '@/chain/Network';

import { useBooklet } from './BookletComposable';
import { CONF } from '@/Conf';
import { packPaletteChoice, palettesMgr } from '@/builder/Palette';
import { inputStore } from '@/builder/inputs/InputStore';
import { getBookletData } from '@/builder/BookletData';

const { setsManager, chainBriqs, currentSet, selectSet } = useBuilder();

provide('chainBriqs', chainBriqs);
provide('messages', {
    pushMessage,
    setTooltip,
});
provide('featureFlags', featureFlags);

const route = useRoute();
const router = useRouter();

const { booklet, bookletData } = useBooklet();
///
onMounted(async () => {
    await inputInitComplete;
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
            console.error(_) /* ignore */
        }

    dispatchBuilderAction('select_set', currentSet.value);

    // Change default palette & update colors.
    if (booklet.value) {
        await getBookletData(booklet.value);
        for (const key in CONF.defaultPalette)
            delete CONF.defaultPalette[key];
        for (const briq of bookletData.value.briqs)
            CONF.defaultPalette[packPaletteChoice(briq.data.material, briq.data.color)] = briq.data.color;

        const palette = palettesMgr.getCurrent();
        palette.shouldSerialize = false;
        palette.reset(true);
        const choice = palette.getFirstChoice();
        inputStore.currentColor = choice.color;
        inputStore.currentMaterial = choice.material;
        logDebug('PALETTE - SWITCHING TO BOOKLET')
    } else {
        const palette = palettesMgr.getCurrent();
        palette.deserialize();
        palette.shouldSerialize = true;
        logDebug('PALETTE - SWITCHING TO DEFAULT')
    }

    dispatchBuilderAction('put_all_in_view');
});
</script>

<template>
    <div class="fixed w-screen h-screen">
        <WebGLCanvas class="z-[-1]"/>
        <MenuBar/>
        <Booklet/>
        <SideBar/>
    </div>
</template>
