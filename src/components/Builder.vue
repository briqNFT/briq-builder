<script setup lang="ts">
import Homepage from './Homepage.vue'
import PickMaterial from './PickMaterial.vue'
import SetOptions from './SetOptions.vue'
import Toolbar from './Toolbar.vue'
import WalletSelector from './WalletSelector.vue';

import { populate } from '../getter.js'
</script>

<template>
  <div id="floatingMenu">
    <h1>briq</h1>
    <h2>Seize the briqs of construction</h2>
    <PickMaterial/>
  </div>
  <Homepage/>
  <SetOptions/>
  <Toolbar/>
  <WalletSelector/>
</template>

<script lang="ts">
import { reactive } from 'vue'

import { builderDataEvents, BuilderDataEvent } from '../builder/BuilderDataEvents'

populate()
export default {
  data() {
    return {
      isModalVisible: false,
    };
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
