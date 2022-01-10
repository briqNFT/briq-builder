<template>
    <div>
        <h1 class="briq-logo">Briq</h1>
        <h2>Settings</h2>
        <button class="btn float-right" @click="$router.push({ name: 'Builder' })">Return to Builder</button>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
})
</script>