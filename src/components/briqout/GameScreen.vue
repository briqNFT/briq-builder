<script setup lang="ts">
import { Game, replay } from 'briqout';
import { reactive, onMounted, onUnmounted, ref } from 'vue';
import { SceneQuality, setupScene, updateScene, render } from './BriqoutGraphics';
import { APP_ENV } from '@/Meta';

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
    setupScene(game, SceneQuality.ULTRA);

    if (!lastTime) {
        lastTime = performance.now();
    }
    requestAnimationFrame(gameLoop);

    if (APP_ENV !== 'prod') {
        /** FPS counter */
        const Stats = (await import('stats.js')).default;
        var stats = new Stats();
        stats.showPanel(0)
        document.body.appendChild(stats.dom);
        const animate = () => {
            stats.end();
            stats.begin();
            requestAnimationFrame(animate);
        }

        stats.begin();
        requestAnimationFrame(animate);
    }
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
    <template v-if="game.status ==='pregame'">
        <div class="w-full h-full bg-white flex flex-col justify-center items-center absolute top-0 left-0">
            <h1 class="mb-12">briqout</h1>
            <Btn @click="reset()">Start game</Btn>
        </div>
    </template>
    <template v-else>
        <div class="m-auto">
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
</template>
