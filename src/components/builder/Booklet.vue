<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue';
import { useBooklet } from './BookletComposable';
import ProgressBar from '../generic/ProgressBar.vue';
import BookletStepRenderer from './genesis/BookletStepRenderer.vue';
import confetti from 'canvas-confetti';
import { pushModal } from '../Modals.vue';
import BookletComplete from './modals/BookletComplete.vue';
import { palettesMgr } from '@/builder/Palette';
import { useGenesisStore } from '@/builder/GenesisStore';
import { backendManager } from '@/Backend';
import { getCurrentNetwork } from '@/chain/Network';

import QRCode from 'qrcode';

const {
    getStepImgSrc,
    shapeValidity,
    booklet,
    bookletData,
    minimized,
} = useBooklet();

const particlesCanvas = ref(null as unknown as HTMLCanvasElement);
const microCanvas = ref(null as unknown as HTMLCanvasElement);

let confettiGenerator: ReturnType<confetti.create>;
let microConfetti: ReturnType<confetti.create>;
onMounted(async () => {
    confettiGenerator = await confetti.create(particlesCanvas.value, {
        resize: true,
        useWorker: true,
    });
    microConfetti = await confetti.create(microCanvas.value, {
        resize: true,
    });
});

const fire = () => {
    const options = {
        particleCount: 25,
        startVelocity: Math.random() * 45 + 5,
        spread: 110,
        decay: 0.93,
        gravity: 0.8,
        ticks: 350,
        zIndex: 10000,
        colors: palettesMgr.getCurrent().choices.map(w => `#${w.split('#')[1]}`),
    }
    confettiGenerator(Object.assign({
        angle: -20,
        origin: {
            x: 0,
            y: 0,
        },
    }, options));
    confettiGenerator(Object.assign({
        angle: 20 + 180,
        origin: {
            x: 1,
            y: 0,
        },
    }, options));
}


const goodFetti = () => {
    microConfetti({
        particleCount: 20,
        startVelocity: 5,
        spread: 460,
        gravity: 0.3,
        ticks: 30,
        colors: ['#00ea00'],
        origin: {
            x: 0.5,
            y: 0.5,
        },
    });
}


const middleFetti = () => {
    microConfetti({
        particleCount: 20,
        startVelocity: 5,
        spread: 460,
        gravity: 0.3,
        ticks: 30,
        colors: ['#ffbb00'],
        origin: {
            x: 0.5,
            y: 0.5,
        },
    });
}

const badFetti = () => {
    microConfetti({
        particleCount: 20,
        startVelocity: 5,
        spread: 460,
        gravity: 0.3,
        ticks: 30,
        colors: ['#ff0000'],
        origin: {
            x: 0.5,
            y: 0.5,
        },
    });
}

watch([shapeValidity], async () => {
    if (shapeValidity.value === 1) {
        fire();
        fire();
        fire();
        fire();
        fire();
        fire();
        fire();
        fire();
        fire();
        fire();
        fire();
        let onModal = pushModal(BookletComplete, {
            background: 'rgba(0, 0, 0, 0.01)',
        });
        let timeout = setInterval(() => fire(), 300);
        await onModal;
        clearInterval(timeout);
    }
})

watch([shapeValidity], (nv, ov) => {
    if (nv - ov >= 0.5 / bookletData.value?.briqs?.length)
        goodFetti();
    else if (nv > ov || ov - nv <= 0.5 / bookletData.value?.briqs?.length)
        middleFetti();
    else
        badFetti();
})

const currentPage = ref(0);
const lastPage = computed(() => +bookletData.value.nb_pages + 2 || 0);

const lowerPage = () => {
    if (--currentPage.value < 0)
        currentPage.value = lastPage.value - 1;
}
const higherPage = () => {
    if (++currentPage.value > lastPage.value - 1)
        currentPage.value = 0;
}

let watcher: unknown;
onMounted(() => {
    if (window.sessionStorage.getItem(`booklet_${booklet.value}`))
        currentPage.value = +window.sessionStorage.getItem(`booklet_${booklet.value}`);
    watcher = watchEffect(() => {
        window.sessionStorage.setItem(`booklet_${booklet.value}`, `${currentPage.value}`)
    })
});
onBeforeUnmount(() => watcher());

const genesisStore = useGenesisStore();
genesisStore.coverItemRoute(booklet.value, true);

const qrCodeCanvas = ref(null as unknown as HTMLCanvasElement);
watchEffect(async () => {
    await QRCode.toCanvas(qrCodeCanvas.value, backendManager.getRoute(`booklet/pdf/${getCurrentNetwork()}/${booklet}.pdf`), { width: 300 });
})

const showQrCode = ref(false);
</script>

<template>
    <div v-if="booklet && !minimized" class="mx-1 sm:mx-2 sm:mt-2 w-fit min-w-[16rem] float-right border border-grad-light !shadow-none !text-sm rounded-md bg-grad-lightest">
        <h6 class="font-semibold text-sm leading-figma bg-grad-lighter bg-opacity-50 rounded-t-md px-4 py-3">Booklet</h6>
        <div class="flex-col">
            <template v-if="!!bookletData">
                <div class="flex px-1 py-1 text-sm font-medium justify-between items-center border-b border-grad-light">
                    <Btn no-background class="w-10" @click="lowerPage"><i class="fas fa-chevron-left"/></Btn>
                    <span>{{ currentPage + 1 }}/{{ lastPage }}</span>
                    <Btn no-background class="w-10" @click="higherPage"><i class="fas fa-chevron-right"/></Btn>
                </div>
                <div class="relative w-[400px] h-[400px]">
                    <BookletStepRenderer v-if="currentPage > 0" :glb_name="booklet" :i="currentPage - 1"/>
                    <div v-else class="w-full h-full relative">
                        <div :style="{ backgroundImage: `url(${genesisStore.coverItemRoute(booklet)}), url(${genesisStore.coverItemRoute(booklet, true)}` }" class="p-4 w-full h-full bg-contain bg-origin-content bg-center bg-no-repeat bg-contain"/>
                        <p class="absolute bottom-0 mb-4 text-center">Follow the instructions of the booklet and build your Official Set !</p>
                        <div :class="`absolute top-0 left-0 justify-center z-1 items-center w-full h-full bg-grad-lightest ${showQrCode ? 'flex' : 'hidden'}`"><canvas :class="`transition-all ${showQrCode ? 'opacity-100' : 'opacity-0'}`" ref="qrCodeCanvas"/></div>
                        <a
                            target="_blank" @mouseenter="showQrCode = true" @pointerleave="showQrCode = false" :href="backendManager.getRoute(`booklet/pdf/${getCurrentNetwork()}/${booklet}.pdf`)"
                            class="absolute z-2 left-4 top-4">
                            <Btn secondary class="w-10 h-10 p-0"><i class="far fa-qrcode text-xl"/></Btn>
                        </a>
                    </div>
                </div>
                <div class="border-t border-grad-light">
                    <div class="mx-4 my-4 relative">
                        <p class="flex justify-between mb-2"><span>Progress</span><span class="text-right font-medium">{{ Math.floor(shapeValidity*100) }}%</span></p>
                        <ProgressBar
                            class="!block !h-3 my-0"
                            :percentage="shapeValidity*100"
                            :color="shapeValidity > ((bookletData.steps_progress[currentPage - 1] - 0.2) / bookletData.briqs.length) ? 'rgb(var(--color-info-success))' : undefined"/>
                        <div
                            v-show="shapeValidity < 1" :style="{ left: `${(bookletData.steps_progress[currentPage - 1]) / bookletData.briqs.length*100}%` }"
                            class="w-1 h-4 absolute -bottom-0.5 rounded-sm bg-grad-dark"/>
                        <canvas ref="microCanvas" class="absolute w-[200px] h-[200px] top-6 translate-x-[-50%] -translate-x-1/2 -translate-y-1/2 pointer-events-none" :style="{ left: `${shapeValidity*100}%` }"/>
                    </div>
                </div>
            </template>
            <div v-else class="p-4">
                <p>Loading booklet data</p>
                <p class="text-center"><i class="fas fa-spinner animate-spin"/></p>
            </div>
            <teleport to="#app"><canvas ref="particlesCanvas" class="fixed w-screen h-screen top-0 left-0 pointer-events-none"/></teleport>
        </div>
    </div>
</template>
