<template>
    <div class="md:w-2/5 w-auto max-h-full overflow-auto flex">
        <div class="relative flex flex-col w-full">
            <button @click="$emit('close')" class="absolute right-0">X</button>
            <h2 class="my-4 text-center w-full">Screenshot</h2>
            <!-- This is here just to trigger the recompute. -->
            <template v-if="image"></template>
            <div class="max-h-[30rem] overflow-auto">
                <canvas class="border-briq-light border-8 my-2 w-full object-contain" ref="screenshot"></canvas>
            </div>
            <div class="my-2">
                <p><label><input v-model="showWatermark" type="checkbox"> Show briq watermark</label></p>
                <p><label><input v-model="showMetadata" type="checkbox"> Show title & author</label></p>
            </div>
            <div class="my-4 flex gap-2 w-full justify-around">
                <Button @click="downloadImg">Download</Button>
                <a target="_blank" :href="`https://twitter.com/intent/tweet?text=Check out my briqs!&url=${link}&via=briqs_`">
                <Button @click="downloadImg"><i class="fab fa-twitter"></i> Tweet</Button></a>
            </div>
        </div>
    </div>
</template>

<style scoped>
/*
    input[type=checkbox] {
        visibility: hidden;
        position:relative;
    }
    input[type=checkbox]:checked:after {
        content: " ";
        @apply block visible w-full h-full rounded-sm bg-deep-blue;
    }
*/
</style>

<script lang="ts">
import { takeScreenshot } from '../../../builder/graphics/builder.js';
import { downloadData } from '../../../url';

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
            screenData: undefined as any,
            showWatermark: true,
            showMetadata: true,
        }
    },
    emits: ["close"],
    props: ["metadata"],
    mounted() {
        this.takeScreen();
    },
    computed: {
        link() {
            return window.location.href;
        },
        image() {
            // Goes first for reactivity.
            let img = this.screenData;
            let canvas = (this.$refs.screenshot as HTMLCanvasElement);
            if (!canvas)
                return false;
            let ctx = canvas.getContext('2d');

            let dpi = window.devicePixelRatio || 1;
            canvas.width = img.width * dpi;
            canvas.height = img.height * dpi + (this.showMetadata ? 190 * dpi : 0);
            ctx.scale(dpi, dpi);
            ctx.fillStyle = "#EB5600";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.drawImage(img,0,0);
            
            let bottom = img.height + (this.showMetadata ? 190 : 0);
            if (this.showWatermark)
            {
                ctx.font = '700 48px Source Sans Pro';
                ctx.textAlign = "right";
                ctx.fillStyle = "white";
                ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
                ctx.shadowBlur = 10 * dpi;
                ctx.fillText('briq', img.width - 16, bottom - 24);
            }

            if (this.showMetadata)
            {
                ctx.font = '400 76px Raleway';
                ctx.textAlign = "center";
                ctx.fillStyle = "white";
                ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
                ctx.shadowBlur = 6 * dpi;
                ctx.fillText(this.metadata.setData.name, img.width / 2, bottom - 102);
                ctx.font = '200 16px Raleway';
                ctx.fillText(this.metadata.setData.id, img.width / 2, bottom - 70);
                ctx.font = '200 22px Raleway';
                ctx.fillText("by " + this.metadata.author, img.width / 2, bottom - 32);
            }
            return true;
        }
    },
    methods: {
        takeScreen() {
            let uri = takeScreenshot();
            let img = new Image();
            img.src = uri;
            img.decode().then(() => this.screenData = img);

        },
        async downloadImg() {
            downloadData(await (await fetch(this.$refs.screenshot.toDataURL())).blob(), "image/png", "set");
        },
    }
})
</script>