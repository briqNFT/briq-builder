<script setup lang="ts">
import WebGLCanvas from './WebGLCanvas.vue'
import MenuBar from './MenuBar.vue'
import SideBar from './SideBar.vue'
import SideBarRight from './SideBarRight.vue'
import MiddleModal from '../MiddleModal.vue'
import Messages from '../Messages.vue'
import SplashScreen from './SplashScreen.vue'

import MintProxy from './MintProxy.vue';
import AlphaBanner from '../AlphaBanner.vue';
import AlphaLogo from './AlphaLogo.vue';
</script>

<template>
    <SplashScreen @done="onLoaded"/>
    <div>
        <WebGLCanvas/>
        <AlphaLogo/>
        <MenuBar/>
        <SideBar/>
        <SideBarRight/>
        <Messages/>
        <MiddleModal/>
        <MintProxy/>
    </div>
    <AlphaBanner/>
</template>

<script lang="ts">
import { setModal } from '../MiddleModal.vue'
import WalletSelectorVue from '../WalletSelector.vue';

import { pushMessage, setTooltip } from '../../Messages'
export default {
    data() {
        return {
        };
    },
    provide: {
        messages: {
            pushMessage, setTooltip
        },
    },
    methods: {
        onLoaded() {
            // TODO: maybe wait for more specific things?
            if (!this.$store.state.wallet.signer)
                setModal(WalletSelectorVue)
        }
    }
};
</script>

<style scoped>
</style>
