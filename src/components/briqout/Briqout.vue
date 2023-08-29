<script setup lang="ts">
import { Game, replay } from 'briqout';
import { reactive, onMounted, onUnmounted, ref } from 'vue';
import { SceneQuality, useRenderer, setupScene, updateScene, render } from './BriqoutGraphics';

const gameCanvas = ref(null);

const game = reactive(new Game());

let lastTime = undefined;

const gameLoop = () => {
    const t = performance.now();
    const delta = (t - lastTime)/1000.0;
    
    if (game.update(delta))
        lastTime = t;

    updateScene(game, delta);
    render(delta);
    requestAnimationFrame(gameLoop);
};

const reset = () => {
    lastTime = performance.now();
    game.start();
}

const onMouseMove = (ev) => {
    game.pushEvent({
        type: 'mousemove',
        x: ev.clientX / window.innerWidth,
    });
}

onMounted(async () => {
    window.addEventListener('mousemove', onMouseMove);
    await useRenderer(gameCanvas.value);
    setupScene(game, SceneQuality.ULTRA);

    if (!lastTime) {
        lastTime = performance.now();
    }
    requestAnimationFrame(gameLoop); 
});

onUnmounted(() => {
    window.removeEventListener('mousemove', onMouseMove);
});

</script>

<style scoped>
.paddle {
    @apply w-[10rem] h-8 bg-red-500 translate-x-[-50%] translate-y-[50%] absolute bottom-[20px];
}

.briqItem {
    @apply bg-blue-500 absolute;
}

.gameZone {
    @apply relative border-2 border-black;
}

.ball {
    @apply bg-green-500 absolute rounded-full translate-x-[-50%] translate-y-[-50%];
}
</style>

<template>
    <h1>briqout</h1>

    <div class="m-auto">
        <canvas class="w-full h-full" ref="gameCanvas"></canvas>

        <div class="w-full h-full bg-white flex justify-center items-center absolute top-0 left-0" v-if="game.status === 'pregame'">
            <button @click="game.start()">Start game</button>
        </div>
        <div class="w-full h-full bg-info-error flex justify-center items-center absolute top-0 left-0" v-if="game.status === 'lost'">
            <button @click="reset()">LOSER</button>
            <button @click="replay(game.exportTrace())">check trace</button>
        </div>
        <div class="w-full h-full bg-info-success bg-opacity-50 flex justify-center items-center absolute top-0 left-0" v-if="game.status === 'won'">
            <button @click="reset()">replay</button>
            <button @click="replay(game.exportTrace())">check trace</button>
        </div>
    </div>

    <div>
        Debug trace:
        <p v-for="trace in game.gameTrace">{{ trace }}</p>
    </div>
</template>
