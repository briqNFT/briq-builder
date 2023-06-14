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

const {
    getStepImgSrc,
    shapeValidity,
    booklet,
    bookletData,
    bookletFetch,
    minimized,
} = useBooklet();

const genesisStore = useGenesisStore();

const particlesCanvas = ref(null as unknown as HTMLCanvasElement);
const snowCanvas = ref(null as unknown as HTMLCanvasElement);
const microCanvas = ref(null as unknown as HTMLCanvasElement);

const isConfettiSetup = ref(false);

let confettiGenerator: ReturnType<confetti.create>;
let snowGenerator: ReturnType<confetti.create>;
let microConfetti: ReturnType<confetti.create>;
onMounted(async () => {
    await bookletFetch.value?._fetch;
    confettiGenerator = await confetti.create(particlesCanvas.value, {
        resize: true,
        useWorker: true,
    });
    snowGenerator = await confetti.create(snowCanvas.value, {
        resize: true,
        useWorker: true,
    });
    microConfetti = await confetti.create(microCanvas.value, {
        resize: true,
    });
    isConfettiSetup.value = true;
});

let snowInterval;
onMounted(() => {
    if (booklet.value === 'briqmas/briqmas_tree')
        snowInterval = setInterval(snow, 300);
})
onBeforeUnmount(() => {
    if (snowInterval)
        clearInterval(snowInterval);
});
const snow = () => {
    const options = {
        particleCount: 2,
        startVelocity: 50,
        spread: 120,
        decay: 0.93,
        gravity: Math.random() * 0.3 + 0.65,
        ticks: 600,
        zIndex: 9000,
        colors: ['cceaea', 'ccdddd'],
        shapes: ['circle'],
        scalar: Math.random() * 0.5 + 0.7,
        disableForReducedMotion: true,
        drift: Math.random() * 0.6 + 0.25,
    }
    snowGenerator(Object.assign({
        angle: -120,
        origin: {
            x: 0.3,
            y: -1,
        },
    }, options));
    snowGenerator(Object.assign({
        angle: -60,
        origin: {
            x: 0.5,
            y: -1,
        },
    }, options));

}


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
    if (!isConfettiSetup.value)
        return;
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
    if (!isConfettiSetup.value)
        return;
    if (nv - ov >= 0.5 / bookletData.value?.briqs?.length)
        goodFetti();
    else if (nv > ov || ov - nv <= 0.5 / bookletData.value?.briqs?.length)
        middleFetti();
    else
        badFetti();
})

const bookletMode = computed(() => {
    return 'booklet';
});
const extraPages = computed(() => bookletMode.value === 'Xplorer' ? 2 : 1);
const isFirstTime = ref(true);
const currentPage = ref(0);
const lastPage = computed(() => +bookletData.value.nb_pages + extraPages.value || 0);

const lowerPage = () => {
    if (--currentPage.value < 0)
        currentPage.value = lastPage.value - 1;
    isFirstTime.value = false;
}
const higherPage = () => {
    if (++currentPage.value > lastPage.value - 1)
        currentPage.value = 0;
    isFirstTime.value = false;
}

let watcher: unknown;
onMounted(() => {
    if (bookletMode.value === 'Xplorer')
        window.localStorage.setItem('showXplorerBanner', 'false');
    if (window.sessionStorage.getItem(`booklet_${booklet.value}`)) {
        currentPage.value = +window.sessionStorage.getItem(`booklet_${booklet.value}`);
        isFirstTime.value = false;
    } else if (shapeValidity.value > 0) {
        isFirstTime.value = false;
        currentPage.value = extraPages.value;
    }
    watcher = watchEffect(() => {
        window.sessionStorage.setItem(`booklet_${booklet.value}`, `${currentPage.value}`)
    })

});
onBeforeUnmount(() => watcher());
</script>

<template>
    <div v-if="booklet && !minimized" class="sm:mt-1 sm:mx-2 mb-2 m-auto w-fit sm:min-w-[16rem] sm:float-right sm:block sm:relative absolute bottom-0 sm:bottom-auto sm:left-auto left-0 right-0 border border-grad-light shadow-lg sm:!shadow-none !text-sm rounded-md bg-grad-lightest select-none z-[10]">
        <h6 class="font-semibold text-sm leading-figma bg-grad-lighter rounded-t-md px-4 py-3 flex justify-between items-center">
            {{ bookletMode === 'Xplorer' ? 'Argent Xplorer Quest' : 'Booklet' }}
            <Btn no-background @click="minimized = true" class="w-6 h-6 p-0 m-0"><i class="text-lg far fa-times"/></Btn>
        </h6>
        <div class="flex flex-col max-w-[400px] md:w-[400px] h-300px tall-md:h-[500px]">
            <template v-if="!!bookletData">
                <div v-show="!isFirstTime" class="flex px-1 py-1 text-sm font-medium justify-between items-center border-b border-grad-light">
                    <Btn no-background class="w-10" @click="lowerPage"><i class="fas fa-chevron-left"/></Btn>
                    <span>{{ currentPage + 1 }}/{{ lastPage }}</span>
                    <Btn no-background class="w-10" @click="higherPage"><i class="fas fa-chevron-right"/></Btn>
                </div>
                <div class="relative flex-1">
                    <BookletStepRenderer v-if="currentPage >= extraPages" :glb_name="booklet" :i="currentPage - extraPages"/>
                    <div v-else :class="'w-full h-full relative flex flex-col gap-4 p-4' + (isFirstTime ? ' py-8' : '')">
                        <template v-if="currentPage === 0 && bookletMode === 'Xplorer'">
                            <h4 class="text-center">Welcome to the briq builder!</h4>
                            <p>The <a href="https://www.argent.xyz/blog/xplorer/" target="_blank">Argent Xplorer Quest</a> for briq requires you to mint an NFT with 10 briqs or more.<br>Follow the steps to build your Xplorer, or do something else you'd like !</p>
                            <!-- Render only in high-quality to get the transparent version for briqmas/dark mode-->
                            <div :style="{ backgroundImage: `url(${genesisStore.coverBookletRoute(booklet, false)})` }" class="p-4 w-full flex-1 h-full bg-contain bg-origin-content bg-center bg-no-repeat bg-contain"/>
                            <div class="flex justify-center gap-4">
                                <Btn class="!text-sm px-8" @click="higherPage(); isFirstTime = true">Start Xploring</Btn>
                            </div>
                        </template>
                        <template v-else-if="bookletMode === 'Xplorer'">
                            <h5>How to use the builder</h5>
                            <div class="[&>p]:mb-1">
                                <p><span class="w-4 inline-flex justify-center"><i class="far fa-cube"/></span> Use 'Place tool' to place briqs with a left-click.</p>
                                <p><span class="w-4 inline-flex justify-center"><i class="far fa-paintbrush-fine"/></span> Use 'Paint tool' to change the briq colors.</p>
                                <p><span class="w-4 inline-flex justify-center"><i class="far fa-eraser"/></span> Use 'Erase tool' to remove briqs.</p>
                            </div>
                            <p>
                                The number of briqs used is shown in the menu.<br>
                                You can also check out the complete help <i class="far fa-circle-question"/>
                            </p>
                            <div class="my-2">
                                <div class="flex justify-between gap-2">
                                    <a class="flex-1" href="https://discord.gg/kpvbDCw5pr" rel="noopener" target="_blank"><Btn secondary class="w-full py-6"><i class="fab fa-discord text-xl mr-3"/> Discord</Btn></a>
                                    <a class="flex-1" href="https://twitter.com/briqNFT" rel="noopener" target="_blank"><Btn secondary class="w-full py-6"><i class="fab fa-twitter text-xl mr-3"/> Twitter</Btn></a>
                                </div>
                                <p class="text-center mt-2">If you run into trouble, reach out to the team !</p>
                            </div>
                            <div class="flex-1 flex justify-center gap-4">
                                <Btn class="self-end !text-sm px-8" @click="higherPage">Start building</Btn>
                            </div>
                        </template>
                        <template v-else>
                            <p class="text-left leading-normal">Follow the instructions of the booklet and<br> build your Official Set !</p>
                            <!-- Render only in high-quality to get the transparent version for briqmas/dark mode-->
                            <div :style="{ backgroundImage: `url(${genesisStore.coverBookletRoute(booklet, false)})` }" class="p-4 w-full flex-1 h-full bg-contain bg-origin-content bg-center bg-no-repeat bg-contain"/>
                            <div class="flex justify-stretch gap-4">
                                <a class="flex-1" target="_blank" :href="backendManager.getRoute(`booklet/pdf/${getCurrentNetwork()}/${booklet}.pdf`)"><Btn secondary class="!text-sm w-full">PDF version</Btn></a>
                                <Btn class="!text-sm flex-1" @click="higherPage">Start building</Btn>
                            </div>
                        </template>
                    </div>
                </div>
                <div v-show="!isFirstTime" class="border-t border-grad-light">
                    <div class="mx-4 my-4 relative">
                        <p v-if="bookletMode === 'Xplorer'" class="mb-2">Xplorer quest: mint NFT with 10+ briqs</p>
                        <p class="flex justify-between mb-2"><span>Progress</span><span class="text-right font-medium">{{ Math.floor(shapeValidity*100) }}%</span></p>
                        <ProgressBar
                            class="!block !h-3 my-0"
                            :percentage="shapeValidity*100"
                            :color="shapeValidity > ((bookletData.steps_progress?.[currentPage - extraPages] - 0.2) / bookletData.briqs.length) ? 'rgb(var(--color-info-success))' : undefined"/>
                        <div
                            v-show="shapeValidity < 1 && currentPage >= extraPages" :style="{ left: `${(bookletData.steps_progress[currentPage - extraPages]) / bookletData.briqs.length*100}%` }"
                            class="w-1 h-4 absolute -bottom-0.5 rounded-sm bg-grad-dark"/>
                        <canvas ref="microCanvas" class="absolute w-[200px] h-[200px] bottom-4 translate-x-[-50%] -translate-x-1/2 translate-y-1/2 pointer-events-none" :style="{ left: `${shapeValidity*100}%` }"/>
                    </div>
                </div>
            </template>
            <div v-else class="p-4">
                <p>Loading booklet data</p>
                <p class="text-center"><i class="fas fa-spinner animate-spin"/></p>
            </div>
            <teleport to="#app">
                <canvas ref="snowCanvas" class="fixed w-screen h-screen top-0 left-0 pointer-events-none"/>
                <canvas ref="particlesCanvas" class="fixed w-screen h-screen top-0 left-0 pointer-events-none"/>
            </teleport>
        </div>
    </div>
</template>
