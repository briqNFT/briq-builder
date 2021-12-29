<script setup lang="ts">
import GA from './components/GA.vue'
import { HotkeyManager } from './Hotkeys'
</script>

<template>
  <GA/>
  <router-view/>
</template>

<script lang="ts">
import { reportError } from './Monitoring';

let mgr = new HotkeyManager();

// Some basic hotkeys available everywhere
mgr.register("escape", { code: "Escape" });

import { defineComponent } from 'vue';
export default defineComponent({
  provide: {
    hotkeyMgr: mgr,
    reportError
  },
})
</script>

<style>
</style>
