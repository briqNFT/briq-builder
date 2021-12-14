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
</script>

<template>
  <SplashScreen/>
  <div>
    <WebGLCanvas/>
    <MenuBar/>
    <SideBar/>
    <SideBarRight/>
    <Messages/>
    <MiddleModal/>
    <WalletSelector/>
    <MintProxy/>
  </div>
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
