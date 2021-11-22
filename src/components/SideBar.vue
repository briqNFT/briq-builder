<script setup lang="ts">
import PickMaterial from "./PickMaterial.vue";
</script>

<template>
    <div id="sideBar" class="flex flex-wrap flex-col px-5 py-20 absolute left-0 top-0 h-full w-20 justify-center">
        <div>
            <PickMaterial/>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({    
})
</script>

<style scoped>
button {
    @apply btn my-2 w-full;
}
</style>