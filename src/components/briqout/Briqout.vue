<script setup lang="ts">
import { Game } from 'briqout';
import { reactive, onMounted } from 'vue';

const game = reactive(new Game());

let lastTime = undefined;

const gameLoop = () => {
    const t = performance.now();
    game.update((t - lastTime)/1000.0);
    lastTime = t;
    requestAnimationFrame(gameLoop);
};

onMounted(() => {
    if (!lastTime) {
        lastTime = performance.now();
    }
    requestAnimationFrame(gameLoop); 
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

    <div class="gameZone"
        :style="{ width: `${game.width}px`, height: `${game.height}px` }"
        @mousemove="(ev) => game.pushEvent(ev)"
        >
        <div class="paddle" :style="{ left: `${game.paddleX}px` }"></div>

        <div v-for="item in game.items" :key="item.x" class="briqItem"
            :style="{ left: `${item.x}px`, top: `${item.y}px`, width: `${item.width}px`, height: `${item.height}px` }">
        </div>

        <div class="ball" :style="{ left: `${game.ball.x}px`, top: `${game.ball.y}px`, width: `${game.ball.radius * 2}px`, height: `${game.ball.radius * 2}px` }">
        </div>
        <div class="w-full h-full bg-white flex justify-center items-center absolute top-0 left-0" v-if="game.status === 'pregame'">
            <button @click="game.start()">Start game</button>
        </div>
        <div class="w-full h-full bg-info-error flex justify-center items-center absolute top-0 left-0" v-if="game.status === 'lost'">
            <button @click="game.start()">LOSER</button>
        </div>
    </div>
    <div>
        Debug trace:
        <p v-for="trace in game.gameTrace">{{ trace }}</p>
    </div>
</template>
