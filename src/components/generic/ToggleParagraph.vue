<script setup lang="ts">
import { ref } from 'vue';

const opened = ref(false);
</script>

<template>
    <div>
        <h4 class="font-bold text-md mb-3 flex justify-between select-none cursor-pointer" @click="opened = !opened">
            <slot name="title"/>
            <span :class="(opened ? 'text-primary' : '') + ' text-md'">
                <i v-if="opened" class="fa-solid fa-chevron-up"/>
                <i v-else class="fa-solid fa-chevron-down"/>
            </span>
        </h4>
        <slot v-if="opened"/>
    </div>
</template>
