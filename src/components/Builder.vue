<script setup lang="ts">
import Homepage from './Homepage.vue'
import PickMaterial from './PickMaterial.vue'
import SetOptions from './SetOptions.vue'
import MenuBar from './MenuBar.vue'
import SideBar from './SideBar.vue'
import SideBarRight from './SideBarRight.vue'
import Toolbar from './Toolbar.vue'
import WalletSelector from './WalletSelector.vue';
import Messages from './Messages.vue'
import SplashScreen from './SplashScreen.vue'
</script>

<template>
  <SplashScreen/>
  <div>
    <Homepage/>
    <SetOptions/>
    <Toolbar :shouldShow="shouldShowToolbar"/>
    <SideBar/>
    <SideBarRight/>
    <MenuBar/>
    <Messages/>
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
  }
};
</script>

<style scoped>
</style>
