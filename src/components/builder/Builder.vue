<script setup lang="ts">
import WebGLCanvas from './WebGLCanvas.vue';
import MenuBar from './MenuBar.vue';
import SideBar from './SideBar.vue';
import SideBarRight from './SideBarRight.vue';
import Modals, { pushModal } from '../Modals.vue';
import Messages from '../Messages.vue';
import SplashScreen from './SplashScreen.vue';

import AlphaBanner from '../AlphaBanner.vue';
import AlphaLogo from './AlphaLogo.vue';
import SetToolbar from './SetToolbar.vue';
import CursorTooltip from '../generic/CursorTooltip.vue';
</script>

<template>
    <div class="fixed w-screen h-screen">
        <WebGLCanvas/>
        <AlphaLogo/>
        <MenuBar/>
        <SetToolbar/>
        <SideBar/>
        <SideBarRight/>
    </div>
    <Modals/>
    <Messages/>
    <AlphaBanner/>
    <CursorTooltip/>
</template>

<script lang="ts">
import { featureFlags } from '@/FeatureFlags';

import { setsManager, checkForInitialGMSet } from '../../builder/SetsManager';
import contractStore from '@/chain/Contracts';
import { watchEffectAndWait } from '../../Async';

import { dispatchBuilderAction } from '@/builder/graphics/Dispatch';

import { inputInitComplete } from '@/builder/inputs/InputLoading';
import { pushMessage, setTooltip } from '../../Messages';
import { defineComponent, reactive, watchEffect, toRef } from 'vue';

import { walletStore2 } from '@/chain/Wallet';

import { createChainBriqs } from '../../builder/ChainBriqs';

let chainBriqs = createChainBriqs();
export default defineComponent({
    data() {
        return {};
    },
    provide: {
        chainBriqs: chainBriqs,
        messages: {
            pushMessage,
            setTooltip,
        },
        featureFlags,
    },
    created() {
        chainBriqs.setAddress(toRef(walletStore2, 'userWalletAddress'));
        watchEffect(() => {
            chainBriqs.setContract(contractStore.briq);
        });
    },
    async mounted() {
        setsManager.clear();
        setsManager.loadFromStorage();
        await inputInitComplete;
        let set = checkForInitialGMSet();
        if (set)
            await this.$store.dispatch('builderData/select_set', set.id);

        let previousSet = window.localStorage.getItem('current_set');
        if (previousSet && setsManager.getInfo(previousSet))
            await this.$store.dispatch('builderData/select_set', previousSet);

        // Must have a local set.
        await watchEffectAndWait(async () => {
            if (
                !this.$store.state.builderData.currentSet ||
                !setsManager.getInfo(this.$store.state.builderData.currentSet.id)
            ) {
                let set = setsManager.getLocalSet();
                if (!set)
                    set = setsManager.createLocalSet();
                await this.$store.dispatch('builderData/select_set', set.id);
            }
        });

        await dispatchBuilderAction('put_all_in_view');

        // For storage space optimisation, delete non-current chain-only sets.
        for (let sid in setsManager.setsInfo)
            if (this.$store.state.builderData.currentSet.id !== sid && setsManager.setsInfo[sid].isOnChain())
                setsManager.deleteLocalSet(sid);

        // Reset history so we start fresh.
        await this.$store.dispatch('reset_history');

        watchEffect(() => {
            window.localStorage.setItem('current_set', this.$store.state.builderData.currentSet.id);
        });

        // TODO: centralise these?
        setsManager.watchForChain(contractStore, walletStore2);
    },
});
</script>

<style scoped></style>
