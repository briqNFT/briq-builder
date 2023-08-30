<script setup lang="ts">
import { ref, watch } from 'vue';
import { briqoutStore } from './GameData';
import { useRenderer } from './BriqoutGraphics';
import GameScreen from './GameScreen.vue';

const gameCanvas = ref(null);

const comp = ref(undefined);


const canvasResolved = async () => {
    briqoutStore.canvas = gameCanvas.value;
    await useRenderer(gameCanvas.value);
    comp.value = GameScreen;
};

const stopWatch = watch(gameCanvas, () => canvasResolved() && stopWatch());

</script>

<template>
    <Suspense>
        <canvas ref="gameCanvas" class="absolute w-screen h-screen"></canvas>
        <template #fallback>
            <div class="w-full h-full flex justify-center items-center">
                <div class="text-4xl text-gray-500">Loading...</div>
            </div>
        </template>
    </Suspense>
    <div class="absolute min-w-[100vw] min-h-screen">
        <component v-if="comp" :is="comp"/>
    </div>
</template>
