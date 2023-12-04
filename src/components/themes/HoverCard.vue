<script setup lang="ts">
import ObjectDetailCard from '@/components/themes/ObjectDetailCard.vue';

defineProps<{
    network: string,
    themeName: string;

    status: 'NA' | 'FETCHING' | 'LOADED' | 'ERROR';

    hoveredAuction: string | undefined;
    hoverLock: string | undefined;
}>();
</script>

<style scoped>

.fade-enter-to, .fade-leave-from, .fade-hoverlock-leave-from
{
    opacity: 100%;
}

.fade-enter-from, .fade-leave-to, .fade-hoverlock-leave-to,
    .fake-fadeout-leave-from, .fake-fadeout-leave-to,
    .fake-fadeout-enter-to, .fake-fadeout-enter-from {
    opacity: 0%;
}
.fake-fadeout-leave-active {
    transition: all 0s;
}
.fade-enter-active, .fade-leave-active, .fake-fadeout-enter-active {
    transition: all 0.3s ease !important;
}
.fade-hoverlock-leave-active {
    transition: all 0.2s ease !important;
}
.fade-hoverlock-leave-from {
    @apply !rotate-[3deg];
}
.fade-hoverlock-leave-to {
    @apply !rotate-[6deg];
}

</style>

<template>
    <div class="relative tall-sm:min-h-[30rem]">
        <div class="sticky top-[4.3rem] tall-sm:top-[7.3rem] tall-sm:md:top-[9.2rem] z-5 flex justify-center w-full">
            <div v-if="status === 'LOADED'" class="tall-sm:max-w-[26rem] tall-sm:min-h-[38rem] relative w-full">
                <Transition name="fade-hoverlock">
                    <ObjectDetailCard
                        v-if="hoverLock"
                        :key="hoverLock"
                        :class="`!absolute top-0 transition-all duration-500 origin-bottom-left ${ hoveredAuction && hoveredAuction !== hoverLock ? 'rotate-[3deg]' : '' }`"
                        :expand="true"
                        :network="network"
                        :theme="themeName"
                        :token-id="hoverLock"/>
                </Transition>
                <!-- This item exists solely so that the opacity transition doesn't reveal the background but stays on a card,
                                        since that looks better -->
                <Transition name="fake-fadeout">
                    <ObjectDetailCard
                        v-if="hoveredAuction && hoveredAuction !== hoverLock"
                        :class="`!absolute top-0`"
                        :network="network"
                        :theme="themeName"
                        :token-id="hoveredAuction"/>
                </Transition>
                <Transition name="fade">
                    <ObjectDetailCard
                        :key="hoveredAuction"
                        v-if="hoveredAuction && hoveredAuction !== hoverLock"
                        :class="`!absolute top-0 ${hoverLock ? '!shadow-xl' : ''}`"
                        :network="network"
                        :theme="themeName"
                        :token-id="hoveredAuction"/>
                </Transition>
            </div>
        </div>
    </div>
</template>