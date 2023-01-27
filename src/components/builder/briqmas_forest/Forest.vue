<script setup lang="ts">
import { backendManager } from '@/Backend';
import Header from '@/components/landing_page/Header.vue';
import { Fetchable } from '@/DataFetching';
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { loadTree, putTreeInScene, render, SceneQuality, setupScene, useRenderer } from './ForestRenderer';
import * as starknet from 'starknet';
import { APP_ENV } from '@/Meta';
import { getCurrentNetwork } from '@/chain/Network';

const forestCanvas = ref(null as unknown as HTMLCanvasElement);


let shouldRender = true;
let lastFrameTime = 0.0;
const doRendering = (frameTime: number) => {
    if (!shouldRender)
        return;
    render((frameTime - lastFrameTime)/1000.0);
    lastFrameTime = frameTime;
    requestAnimationFrame((frameTime: number) => {
        doRendering(frameTime);
    });
}

onMounted(async () => {
    await useRenderer(forestCanvas.value);
    setupScene(SceneQuality.ULTRA);
    doRendering(0.001);
    loadTrees();
});

onBeforeUnmount(() => {
    shouldRender = false;
});

const trees = new Fetchable();
trees.fetch(async () => {
    return await backendManager.fetch(`v1/forest/${getCurrentNetwork()}/full_data`)
});

function mulberry32(a) {
    return function() {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

const findPos = (positions, idx: number) => {
    if (idx >= 1000)
        idx = 0;
    if (positions[idx].claimant)
        return findPos(positions, idx+1);
    return positions[idx];
}

const loadTrees = async () => {
    await trees._fetch;

    const positions = {};
    const rand = mulberry32(42);
    for (let i = 0; i < 1000; ++i)
        positions[i] = {
            pos: [rand() * 100 - 50, rand() * 100 - 50],
            claimant: null,
        }
    for (const treeId in trees._data!)
        loadTree(getCurrentNetwork(), APP_ENV === 'dev' ? '0xd754474c9dbc029e3894ef69c61f6f86b970280705f45f7000000000000000' : treeId).then(_ => {
            const tree = putTreeInScene(getCurrentNetwork(), APP_ENV === 'dev' ? '0xd754474c9dbc029e3894ef69c61f6f86b970280705f45f7000000000000000' : treeId);

            const idx = Math.floor(starknet.number.toBN(treeId).umod(starknet.number.toBN(1000)).toNumber());
            const pos = findPos(positions, idx);
            pos.claimant = treeId;
            tree.position.x = pos.pos[0];
            tree.position.z = pos.pos[1];
            const scale = 0.4 + trees._data[treeId].age / 3600 / 24 / 30;
            tree.scale.set(scale, scale, scale);
        })
}

</script>

<template>
    <Header/>
    <h1>briqmas Forest</h1>
    <p>The older the tree, the bigger it is</p>
    <canvas ref="forestCanvas" class="h-full w-full"/>
</template>
