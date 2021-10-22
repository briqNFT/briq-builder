<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import HelloWorld from './components/HelloWorld.vue'
</script>

<template>
  <h1>brq</h1>
  <h2>Seize the brqs of construction</h2>
    <HelloWorld/>
</template>

<script lang="ts">
import { reactive } from 'vue'

var contract = reactive({
	connected: false,
});

setTimeout(() => { contract.connected = true; }, 5000);

import { defineComponent } from 'vue';
export default defineComponent({
	provide: {
		contract
	}
});
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
