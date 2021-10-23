<script setup lang="ts">
import Homepage from './components/Homepage.vue'
import PickMaterial from './components/PickMaterial.vue'
import Contract from './components/Contract.vue'
import { populate } from './getter.js'
import Modal from './components/Modal.vue';

</script>

<template>
  <h1>briq</h1>
  <h2>Seize the briqs of construction</h2>
   <div id="app">
    <button
      type="button"
      class="btn"
      @click="showModal"
    >
      Settings
    </button>

    <Modal
      v-show="isModalVisible"
      @close="closeModal"
    />
  </div>
  <PickMaterial/>
 <Homepage/>
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
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
