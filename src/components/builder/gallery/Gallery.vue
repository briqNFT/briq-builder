<template>
    <Header/>
    <div class="alternate-buttons container m-auto px-2">
        <h1 class="text-center my-8 briq-logo">briq gallery</h1>
        <p class="text-center my-2 text-lg font-medium">
            In the briq gallery we highlight some of the best sets created by the briq community!<br>
            Each set is built out of briqs, the fundamental building block.<br>
            Click on any of see what they look like.<br>
            Send us your own sets on <a href="https://discord.gg/kpvbDCw5pr">Discord</a> or
            <a href="https://twitter.com/briqNFT">Twitter</a> and we'll add them here!
        </p>
        <div class="flex justify-center gap-10 text-5xl mt-8 mb-8">
            <a href="https://twitter.com/briqNFT" target="_blank"><p><i class="fab fa-twitter"/></p></a>
            <a href="https://discord.gg/kpvbDCw5pr" target="_blank"><p><i class="fab fa-discord"/></p></a>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <GalleryItem
                v-for="(set, index) in galleryItems"
                :key="set"
                :set-id="set"
                :load="index < loadUpTo"
                :version="2"/>
        </div>
        <h1 class="text-center mt-16">Older gallery items</h1>
        <p class="text-center my-4">These sets were minted before Alpha 0.6</p>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <GalleryItem
                v-for="(set, index) in oldGalleryItems"
                :key="set"
                :set-id="set"
                :load="index + galleryItems.length < loadUpTo"
                :version="1"/>
        </div>
        <div ref="scrollMore" class="flex justify-center my-8">
            <Btn v-if="loadUpTo < galleryItems.length + oldGalleryItems.length" @click="loadMore">
                <h2>Load More</h2>
            </Btn>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { fetchData } from '../../../url';
import Header from '../../landing_page/Header.vue';
import GalleryItem from './GalleryItem.vue';
export default defineComponent({
    data() {
        return {
            galleryItems: [],
            oldGalleryItems: [],
            loadUpTo: 40,
            observer: undefined as any,
        };
    },
    async beforeMount() {
        let data = await fetchData('gallery_items');
        if (data?.version !== 2)
            this.galleryItems = data.sets;
        else {
            this.galleryItems = data.sets;
            this.oldGalleryItems = data.sets_v06;
        }
    },
    mounted() {
        this.observer = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting)
                    this.loadMore();
            });
        });
        this.observer.observe(this.$refs.scrollMore);
    },
    components: { Header, GalleryItem },
    methods: {
        loadMore() {
            this.loadUpTo += 40;
        },
    },
});
</script>
