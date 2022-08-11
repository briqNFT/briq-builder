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
import { pushMessage, setTooltip } from '../../Messages';
import { useBuilder } from '@/builder/BuilderStore';
import { builderInputFsm } from '@/builder/inputs/BuilderInput';
import { inputInitComplete } from '@/builder/inputs/InputLoading';

import { store } from '@/store/Store';
import { useRoute, useRouter } from 'vue-router';

const { setsManager, chainBriqs } = useBuilder();

provide('chainBriqs', chainBriqs);
provide('messages', {
    pushMessage,
    setTooltip,
});
provide('featureFlags', featureFlags);

const route = useRoute();
const router = useRouter();

///
onMounted(async () => {
    await inputInitComplete;
    if (route.query['set'])
        try {
            await store.dispatch('builderData/select_set', route.query['set']);
            router.replace({ 'query': null });
        } catch(_) { /* ignore */ }
    const info = setsManager.getInfo(store.state.builderData.currentSet.id);

    if (info.status === 'ONCHAIN_LOADED')
        builderInputFsm.switchTo('inspect');
    else
        builderInputFsm.switchTo('place');
    dispatchBuilderAction('select_set', store.state.builderData.currentSet);

    dispatchBuilderAction('put_all_in_view');
});
</script>

<template>
    <div class="fixed w-screen h-screen">
        <WebGLCanvas class="z-[-1]"/>
        <MenuBar/>
        <SideBar/>
        <Booklet/>
    </div>
</template>
