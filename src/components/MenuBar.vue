<script setup lang="ts">
import UndoRedo from './Tools/UndoRedo.vue'
</script>

<template>
    <div id="menuBar">
        <UndoRedo/>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({    
})
</script>

<style>
#menuBar {
    position: absolute;
    top: 1rem;
    width: 100vw;
    display:flex;
}

.toolButton {
    width:5rem;
    height:5rem;
    background:#ee7722;
    border-radius:1rem;
    padding:0.3rem;
    margin:0.3rem;
}
</style>