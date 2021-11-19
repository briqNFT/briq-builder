<script setup lang="ts">
import Homepage from './Homepage.vue'
import PickMaterial from './PickMaterial.vue'
import SetOptions from './SetOptions.vue'
import MenuBar from './MenuBar.vue'
import Toolbar from './Toolbar.vue'
import WalletSelector from './WalletSelector.vue';
</script>

<template>
  <div id="floatingMenu" :class="hidden">
    <h1>briq</h1>
    <h2>Seize the briqs of construction</h2>
    <PickMaterial/>
    <p class="hoverbutton">Hover to pick material</p>
  </div>
  <div @pointermove="checkMousePos" ref="builder">
    <MenuBar/>
    <Homepage/>
    <SetOptions/>
    <Toolbar :shouldShow="shouldShowToolbar"/>
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
      hidden: "",
    };
  },
  created: function() {
  },
  mounted: function() {
    builderDataEvents.push(new BuilderDataEvent("change_set"));
    setTimeout(() => {
      this.hidden = "hidden";
    }, 5000);
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
@media screen and (min-height: 800px) {
  #floatingMenu {
    z-index: 2;
    position:fixed;
    top: 0;
    margin: auto;
    left: 50%;

    transform: translate(-50%,0);
    transition: transform 0.2s;
  }
  #floatingMenu.hidden:not(:hover) {
    transform: translate(-50%, calc(-100% + 1.8rem));
    transition: transform 0.2s;
  }
  .hoverbutton
  {
      background: rgba(255, 255, 255, 0.5);
      border-radius:0 0 1rem 1rem;
      height: 1.8rem;
      margin: 0 4rem 0 4rem;
  }
  #floatingMenu:hover .hoverbutton, #floatingMenu:not(.hidden) .hoverbutton
  {
      display:none;
  }
}
@media screen and (max-height: 800px) {
  #floatingMenu {
    position: relative;
    max-height: 13rem;
  }
  @media (min-width: 500px) {
    #floatingMenu {
      max-height: 10rem;
    }
  }
}

</style>
