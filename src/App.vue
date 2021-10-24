<script setup lang="ts">
import Homepage from './components/Homepage.vue'
import PickMaterial from './components/PickMaterial.vue'
import Contract from './components/Contract.vue'
import SetOptions from './components/SetOptions.vue'
import { populate } from './getter.js'
import Modal from './components/Modal.vue';

</script>

<template>
  <div id="floatingMenu">
    <h1>briq</h1>
    <h2>Seize the briqs of construction</h2>
    <div id="app">
      <button
        type="button"
        class="btn"
        @click="showModal"
      >Settings</button>

      <Modal
        v-show="isModalVisible"
        @close="closeModal"
      />
    </div>
    <PickMaterial/>
  </div>
  <Homepage/>
  <SetOptions/>
</template>

<script lang="ts">
import { reactive } from 'vue'
populate()

export default {
  name: 'App',
  components: {
    Modal,
  },
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

<style>
html, body {
  margin: 0;
  padding: 0;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
* {
  box-sizing: border-box;
}
#floatingMenu {
  z-index: 2;
  position:fixed;
  top: 0;
  margin: auto;
  left: 50%;
  transform: translate(-50%,0);
}

h1 {
  font-size: 5rem;
  margin:0;
}

h2 {
  font-size: 2rem;
  margin:0;
  margin-bottom:2rem;
}

</style>
