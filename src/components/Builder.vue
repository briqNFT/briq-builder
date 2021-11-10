<script setup lang="ts">
import Homepage from './Homepage.vue'
import PickMaterial from './PickMaterial.vue'
import SetOptions from './SetOptions.vue'
import Debug from './Debug.vue'

import { populate } from '../getter.js'

var isProd = import.meta.env.PROD;

</script>

<template>
  <div id="floatingMenu">
    <h1>briq</h1>
    <h2>Seize the briqs of construction</h2>
    <PickMaterial/>
  </div>
  <Debug v-if="!isProd"/>
  <Homepage/>
  <SetOptions/>
</template>

<script lang="ts">
import { reactive } from 'vue'
populate()
export default {
  data() {
    return {
      isModalVisible: false,
    };
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
