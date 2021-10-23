<script setup lang="ts">
import { picker } from '../materials.js'
</script>

<template>
    <p>Material: {{ picker.material }} </p>
    <input type="number" v-model="picker.material"/>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
export default defineComponent({
})
</script>

<style scoped>

</style>