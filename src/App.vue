<script setup lang="ts">
import Homepage from './components/Homepage.vue'
import PickMaterial from './components/PickMaterial.vue'
import Contract from './components/Contract.vue'
</script>

<template>
<Contract/>
  <h1>brq</h1>
  <h2>Seize the brqs of construction</h2>
  <PickMaterial/>
 <Homepage/>
</template>

<script lang="ts">
import { reactive } from 'vue'
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
