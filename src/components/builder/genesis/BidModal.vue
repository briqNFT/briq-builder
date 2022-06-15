<script setup lang="ts">
import WindowVue from '@/components/generic/Window.vue';
</script>

<template>
    <WindowVue :size="'md:w-[40rem]'">
        <template #big-title>Place a bid</template>
        <div class="flex flex-col gap-8">
            <div class="flex flex-col items-center gap-2">
                <p class="text-md">Current winning bid</p>
                <p class="text-lg font-semibold">1.35 eth</p>
            </div>
            <div>
                <p>
                    Make your bid<br>
                    <input class="w-full my-2" :placeholder="`Bid ${1.35}eth or more`">
                </p>
                <p class="text-right text-sm text-darkest">Available: 2.35 eth</p>
            </div>
            <Btn class="py-5">Place a bid</Btn>
        </div>
    </WindowVue>
</template>