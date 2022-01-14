<template>
    <Header></Header>
    <div class="alternate-buttons container m-auto px-2">
        <h1 class="text-center my-8 font-display">briq Gallery</h1>
        <p class="text-center mb-16 text-lg font-medium"> This allows you to browse sets created by all briqheads.<br />Click on any of them to see what they look like.</p>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <GalleryItem v-for="set, index in galleryItems"
                :key="set"
                :setId="set"
                :load="index < loadUpTo"
            />
        </div>
        <div ref="scrollMore" class="flex justify-center my-8">
            <Btn v-if="loadUpTo < galleryItems.length" @click="loadMore"><h2>Load More</h2></Btn>
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
            loadUpTo: 40,
            observer: undefined as any,
        };
    },
    async beforeMount() {
        this.galleryItems = (await fetchData("gallery_items"))?.sets || [];
    },
    mounted() {
        this.observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
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
            console.log("load more");
        }
    }
});
</script>