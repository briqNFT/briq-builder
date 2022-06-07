<script setup lang="ts">
import WebGLCanvas from './WebGLCanvas.vue';
import MenuBar from './MenuBar.vue';
import SideBar from './SideBar.vue';
import SideBarRight from './SideBarRight.vue';
import Modals, { pushModal } from '../Modals.vue';
import Messages from '../Messages.vue';
import Booklet from './Booklet.vue';

import AlphaBanner from '../AlphaBanner.vue';
import AlphaLogo from './AlphaLogo.vue';
import SetToolbar from './SetToolbar.vue';
import CursorTooltip from '../generic/CursorTooltip.vue';

import { dispatchBuilderAction } from '@/builder/graphics/Dispatch';

import { provide } from 'vue';
import { featureFlags } from '@/FeatureFlags';
import { pushMessage, setTooltip } from '../../Messages';
import { useBuilder } from './BuilderComposable';

const { chainBriqs } = useBuilder();

provide('chainBriqs', chainBriqs);
provide('messages', {
    pushMessage,
    setTooltip,
});
provide('featureFlags', featureFlags);

///

dispatchBuilderAction('put_all_in_view');
</script>

<template>
    <div class="fixed w-screen h-screen">
        <WebGLCanvas/>
        <AlphaLogo/>
        <MenuBar/>
        <SetToolbar/>
        <SideBar/>
        <SideBarRight/>
        <Booklet/>
    </div>
    <Modals/>
    <Messages/>
    <AlphaBanner/>
    <CursorTooltip/>
</template>
