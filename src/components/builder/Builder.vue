<script setup lang="ts">
import Homepage from '../Homepage.vue'
import SetOptions from '../SetOptions.vue'
import MenuBar from '../MenuBar.vue'
import SideBar from '../SideBar.vue'
import SideBarRight from '../SideBarRight.vue'
import Toolbar from '../Toolbar.vue'
import MiddleModal from '../MiddleModal.vue'
import WalletSelector from '../WalletSelector.vue';
import Messages from '../Messages.vue'
import SplashScreen from '../SplashScreen.vue'
</script>

<template>
  <SplashScreen/>
  <div>
    <Homepage/>
    <Toolbar :shouldShow="shouldShowToolbar"/>
    <SideBar/>
    <SideBarRight/>
    <MenuBar/>
    <Messages/>
    <MiddleModal/>
    <WalletSelector/>
  </div>
</template>

<script lang="ts">
import { pushMessage, setTooltip } from '../../Messages'
export default {
  data() {
    return {
      isModalVisible: false,
      shouldShowToolbar: false,
    };
  },
  provide: {
    messages: {
      pushMessage, setTooltip
    }
  },
  created: function() {
  },
  mounted: function() {
  },
  methods: {
  }
};
</script>

<style scoped>
</style>
