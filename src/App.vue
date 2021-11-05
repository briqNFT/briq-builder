<script setup lang="ts">
import GA from './components/GA.vue'
import BurgerMenu from './components/BurgerMenu.vue'
</script>
<template>
  <GA/>
  <BurgerMenu/>
  <router-view/>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  box-sizing: border-box;
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
