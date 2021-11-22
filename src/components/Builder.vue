<script setup lang="ts">
import Homepage from './Homepage.vue'
import PickMaterial from './PickMaterial.vue'
import SetOptions from './SetOptions.vue'
import MenuBar from './MenuBar.vue'
import SideBar from './SideBar.vue'
import Toolbar from './Toolbar.vue'
import WalletSelector from './WalletSelector.vue';

import SplashScreen from './SplashScreen.vue'
</script>

<template>
  <SplashScreen/>
  <div @pointermove="checkMousePos" ref="builder">
    <MenuBar/>
    <Homepage/>
    <SetOptions/>
    <Toolbar :shouldShow="shouldShowToolbar"/>
    <SideBar/>
    <WalletSelector/>
  </div>
</template>

<script lang="ts">
import { reactive } from 'vue'

import { builderDataEvents, BuilderDataEvent } from '../builder/BuilderDataEvents'

export default {
  data() {
    return {
      isModalVisible: false,
      shouldShowToolbar: false,
    };
  },
  created: function() {
  },
  mounted: function() {
    builderDataEvents.push(new BuilderDataEvent("change_set"));
  },
  methods: {
    showModal() {
      this.isModalVisible = true;
    },
    closeModal() {
      this.isModalVisible = false;
    },
    checkMousePos(ev: PointerEvent) {
        this.shouldShowToolbar = this.$refs.builder.getBoundingClientRect().right - ev.clientX < 320;
    }
  }
};
</script>

<style scoped>
</style>
