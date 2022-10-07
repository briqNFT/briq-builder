<script setup lang="ts">
import { ref } from 'vue';

const opened = ref(false);
</script>

<style scoped>
.fade-enter-from {
    opacity: 0%;
}
.fade-enter-to {
    opacity: 100%;
}

.fade-leave-from {
    opacity: 100%;
}
.fade-leave-to {
    opacity: 0%;
}
.fade-enter-active, .fade-leave-active {
  transition: all 0.2s ease !important;
}
</style>
<template>
    <div>
        <h4 class="font-bold text-md mb-3 flex justify-between select-none cursor-pointer" @click="opened = !opened">
            <slot name="title"/>
            <span :class="(opened ? 'text-primary' : '') + ' text-md'">
                <i v-if="opened" class="fa-solid fa-chevron-up"/>
                <i v-else class="fa-solid fa-chevron-down"/>
            </span>
        </h4>
        <Transition name="fade">
            <slot v-if="opened"/>
        </transition>
    </div>
</template>
