<script setup lang="ts">
import WebGLCanvas from './WebGLCanvas.vue'
import MenuBar from './MenuBar.vue'
import SideBar from './SideBar.vue'
import SideBarRight from './SideBarRight.vue'
import MiddleModal from '../MiddleModal.vue'
import WalletSelector from '../WalletSelector.vue';
import Messages from '../Messages.vue'
import SplashScreen from './SplashScreen.vue'

import MintProxy from './MintProxy.vue';
import AlphaBanner from '../AlphaBanner.vue';
import AlphaLogo from './AlphaLogo.vue';
</script>

<template>
  <SplashScreen/>
  <div>
    <WebGLCanvas/>
    <AlphaLogo/>
    <SideBar/>
    <SideBarRight/>
    <MenuBar/>
    <Messages/>
    <MiddleModal/>
    <WalletSelector/>
    <MintProxy/>
  </div>
  <AlphaBanner/>
</template>

<script lang="ts">

import { setModal } from '../MiddleModal.vue';
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
  created: function() {
  },
  mounted: function() {
  },
  methods: {
    setModal
  }
};
</script>

<style scoped>
</style>
