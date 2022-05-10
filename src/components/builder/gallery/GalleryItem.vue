<template>
    <div>
        <a :href="getRelativeShareLink('testnet', setId, version)" target="_blank">
            <div
                v-if="setData"
                class="bg-accent rounded-md px-4 py-2 h-full w-full flex flex-col hover:outline-4 hover:outline hover:outline-darker">
                <h3 class="text-center break-words">{{ setData?.name || setId }}</h3>
                <div class="flex-1 flex flex-col justify-center min-h-[2rem] my-2">
                    <div><img v-if="imgSrc" :src="imgSrc" class="rounded-md"></div>
                    <div
                        v-if="!imgSrc"
                        class="imagePlaceholder min-h-[8rem] rounded-md flex-1 text-center flex flex-col justify-center text-md font-semibold tracking-wider">
                        <p v-if="!loadingImage">No Preview</p>
                        <p v-else=""><i class="fas fa-spinner animate-spin-slow"/></p>
                    </div>
                </div>
            </div>
        </a>
    </div>
</template>

<style scoped>
.imagePlaceholder {
    background: repeating-linear-gradient(
        -45deg,
        rgba(0, 0, 0, 0),
        rgba(0, 0, 0, 0),
        10px,
        rgba(201, 74, 0, 0.5) 10px,
        rgba(201, 74, 0, 0.5) 15px
    );
}
</style>

<script lang="ts">
import { defineComponent } from 'vue';
import { SetData } from '../../../builder/SetData';

import { getRelativeShareLink } from '../Sharing';
import { backendManager } from '@/Backend';

import { reactive } from 'vue';
const setImageCache = reactive({} as { [set: string]: string });

export default defineComponent({
    data() {
        return {
            setData: undefined as undefined | SetData,
            imgSrc: undefined as undefined | string,
            loadingImage: true,
        };
    },
    props: ['load', 'setId', 'version'],
    async beforeMount() {
        this.loadData();
    },
    watch: {
        load() {
            this.loadData();
        },
    },
    methods: {
        getRelativeShareLink,
        async loadData() {
            if (!this.load)
                return;
            this.loadingImage = true;

            this.setData = new SetData(this.setId);
            let data = (await backendManager.getMetadata(this.setId));
            this.setData.deserialize(data);

            this.imgSrc = setImageCache?.[this.setId];
            let src = new Image();
            src.src = backendManager.getPreviewUrl(this.setId);
            try {
                await src.decode();
                this.imgSrc = src.currentSrc;
                setImageCache[this.setId] = src.currentSrc;
            } catch (_) {
                this.imgSrc = undefined;
                delete setImageCache[this.setId];
            }
            this.loadingImage = false;
        },
    },
});
</script>
