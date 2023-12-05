<script setup lang="ts">
import { computed } from 'vue';
import { useThemeURLs } from '@/components/themes/ThemeUrlComposable';
import { getCurrentNetwork } from '@/chain/Network';
import { getBookletMarketplaceUrl, getSetMarketplaceUrl } from '@/chain/Marketplaces';

const props = defineProps<{
    themeName: string;
}>();

const themeName = computed(() => props.themeName);

const {
    themeCoverUrl,
} = useThemeURLs();

const coverUrl = computed(() => {
    return (quality: 'high' | 'low') => {
        let base = themeCoverUrl(themeName.value, quality);
        return base;
    }
})

</script>

<template>
    <div class="bg-black text-white">
        <div class="h-[450px] relative">
            <div class="absolute w-full h-full theme-bg overflow-hidden">
                <img :src="coverUrl('low')" alt="logo" class="invisible absolute h-full 2xl:h-auto 2xl:w-full max-w-none max-h-none top-[50%] translate-y-[-50%] left-[50%] translate-x-[-50%]">
                <div class="h-full w-full bg-cover bg-origin-content bg-center bg-no-repeat" :style="{ backgroundImage: `url(${coverUrl('high')}), url(${coverUrl('low')})` }"/>
            </div>
            <div class="absolute bottom-0 right-0 flex gap-2 p-2">
                <a :href="getSetMarketplaceUrl('pyramid', getCurrentNetwork(), themeName)"><i class="fas fa-duck"/></a>
                <a :href="getBookletMarketplaceUrl('pyramid', getCurrentNetwork(), themeName)"><i class="fas fa-book-open"/></a>
            </div>
        </div>
    </div>
</template>
