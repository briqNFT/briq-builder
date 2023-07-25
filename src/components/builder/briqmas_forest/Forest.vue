<script setup lang="ts">
import { backendManager } from '@/Backend';
import Header from '@/components/landing_page/Header.vue';
import { Fetchable } from '@/DataFetching';
import { ref, onMounted, onBeforeUnmount, reactive, watch } from 'vue';
import { getRaycast, loadTree, putTreeInScene, render, SceneQuality, setupScene, useRenderer } from './ForestRenderer';
import * as starknet from 'starknet';
import { APP_ENV } from '@/Meta';
import { getCurrentNetwork } from '@/chain/Network';
import { getSetLink } from '@/chain/Marketplaces';

const forestCanvas = ref(null as unknown as HTMLCanvasElement);


let shouldRender = true;
let lastFrameTime = 0.0;
const doRendering = (frameTime: number) => {
    if (!shouldRender)
        return;
    const delta = (frameTime - lastFrameTime)/1000.0
    render(delta);
    if (hoveredLock.value)
        hoveredLock.value.rotateY(-1 * delta);
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
    if (APP_ENV === 'dev')
        return await (await fetch('https://api.briq.construction/v1/forest/starknet-mainnet/full_data')).json();
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

const SLOTS_EDGE = 10;
const SCALE = 10;

const findPos = (positions, idx: number) => {
    if (idx >= SLOTS_EDGE*SLOTS_EDGE)
        idx = 0;
    if (positions[idx]?.claimant)
        return findPos(positions, idx+1);
    return positions[idx];
}

const owners = reactive({});

const loadTrees = async () => {
    await trees._fetch;

    const positions = {};
    const rand = mulberry32(42);
    for (let i = 0; i < SLOTS_EDGE; ++i)
        for (let j = 1; j <= SLOTS_EDGE; ++j)
            positions[i * SLOTS_EDGE + j - 1] = {
                pos: [Math.cos(i / SLOTS_EDGE * Math.PI * 2 + j/SLOTS_EDGE) * Math.pow(j, 0.8) * SCALE + rand() * SCALE * 0.4 - SCALE * 0.2,
                      Math.sin(i / SLOTS_EDGE * Math.PI * 2 + j/SLOTS_EDGE) * Math.pow(j, 0.8) * SCALE + rand() * SCALE * 0.4 - SCALE * 0.2],
                claimant: null,
            }
    for (const treeId in trees._data!)
        loadTree(getCurrentNetwork(), treeId).then(_ => {
            const tree = putTreeInScene(getCurrentNetwork(), treeId);

            const idx = Math.floor(starknet.number.toBN(treeId).umod(starknet.number.toBN(SLOTS_EDGE*SLOTS_EDGE)).toNumber());
            const pos = findPos(positions, idx);
            pos.claimant = treeId;
            tree.position.x = pos.pos[0];
            tree.position.z = pos.pos[1];
            tree.position.y = 0.3;
            tree.rotateY(rand() * Math.PI * 2);
            const scale = 0.6 + Math.min(1.0, trees._data[treeId].age / 3600 / 24 / 60);
            tree.scale.set(scale, scale, scale);
            tree.userData.owner = trees._data[treeId].owner;
            tree.userData.age = trees._data[treeId].age;
            tree.userData.id = treeId;
            owners[trees._data[treeId].owner] = new Fetchable();
            owners[trees._data[treeId].owner].fetch(async () => {
                const r = await (await fetch('https://app.starknet.id/api/indexer/addr_to_domain?addr=' + starknet.number.toBN(trees._data[treeId].owner).toString())).json()
                if (r.domain)
                    return r.domain;
            });
        })
}

const hoveredObject = ref(null);
const hoveredLock = ref(null);

const raycast = (event: PointerEvent) => {
    const dim = forestCanvas.value.getBoundingClientRect();
    const obj = getRaycast(event.clientX / dim.width * 2 - 1, (event.clientY - dim.top) / dim.height * -2 + 1);
    hoveredObject.value = obj;
}

const lockCast = () => {
    if (hoveredObject.value && hoveredLock.value !== hoveredObject.value)
        hoveredLock.value = hoveredObject.value;
    else
        hoveredLock.value = undefined;
}

watch(hoveredObject, (ov, nv) => {
    if (ov)
        ov.scale.addScalar(0.2);
    if (nv)
        nv.scale.addScalar(-0.2);
})


const getOwner = (owner: string) => {
    if (owners[owner]._data)
        return owners[owner]._data;
    return owner.slice(0, 8) + '...' + owner.slice(-5);
}

const getAge = (age: number) => {
    let tl = age;
    const days = Math.floor(tl / 24 / 3600);
    if (days > 0)
        return days > 1 ? `${days} days` : `${days} day`;
    tl -= days * 24 * 3600;
    const hours = Math.floor(tl / 3600);
    if (hours > 0)
        return hours > 1 ? `${hours} hours` : `${hours} hour`;
    tl -= hours * 3600;
    const minutes = Math.floor(tl / 60);
    if (minutes > 0)
        return minutes > 1 ? `${minutes} minutes` : `${minutes} minute`;
    tl -= minutes * 60;
    const seconds = Math.floor(tl);
    if (seconds > 0)
        return seconds > 1 ? `${seconds} seconds` : `${seconds} second`;
    return 'right now';
}
</script>

<template>
    <Header/>
    <div class="relative">
        <canvas
            ref="forestCanvas"
            :class="`absolute top-0 w-full h-[calc(100vh-4rem)] ${ hoveredObject ? 'cursor-pointer' : 'cursor-auto' }`"
            @pointermove="raycast"
            @pointerdown="lockCast"/>
        <div class="relative z-1">
            <h1 class="text-center text-white pt-6">briqmas Forest</h1>
            <p class="text-white text-sm text-center pb-4">Pan / rotate using your mouse. Click on a tree to select it.</p>
            <div v-if="hoveredObject || hoveredLock" class="w-full max-w-[40rem] m-auto flex flex-col gap-4 items-center justify-center">
                <p class="text-center text-white">
                    This tree is owned by {{ getOwner(hoveredLock ? hoveredLock.userData.owner : hoveredObject.userData.owner) }}<br>
                    It has been minted {{ getAge(hoveredLock ? hoveredLock.userData.age : hoveredObject.userData.age) }} ago.
                </p>
                <a
                    :href="getSetLink('starknet-mainnet', hoveredLock ? hoveredLock.userData.id : '0')"
                    target="blank_"><Btn secondary>See on Unframed</Btn></a>
            </div>
        </div>
    </div>
</template>
