<template>
    <Window class="md:!w-3/5 !w-auto">
        <template #big-title>Crop Screenshot</template>
        <template #content>
            <div class="px-8">
                <div class="relative my-4">
                    <img class="cursor-crosshair" ref="image" @mousedown="onMouseDown" :src="metadata.screenshot"/>
                    <div class="absolute top-0 left-0 pointer-events-none overflow-hidden">
                        <div ref="overlay" class="outline-black outline opacity-50 outline-[5000px] absolute top-0 left-0">
                        </div>
                    </div>
                </div>
                <div class="flex justify-around">
                    <Btn class="my-2 float-left" @click="$emit('close')"><span class="px-4">Cancel</span></Btn>
                    <Btn class="my-2 float-right" @click="crop"><span class="px-4">Crop</span></Btn>
                </div>
            </div>
            <!-- When the user clicked, overlay a screen to easily allow selecting corners & prevent input on other UI elements. -->
            <div v-if="active" class="fixed top-0 left-0 w-screen h-screen" @mousemove="onMouseMove" @mouseup="onMouseUp"></div>
        </template>
    </Window>
</template>

<script lang="ts">
import { watchEffect, defineComponent } from 'vue';
import { downloadData } from '../../../url';
export default defineComponent({
    data() {
        return {
            sx: 0,
            sy: 0,
            ex: 0,
            ey: 0,
            active: false,
        };
    },
    props: ["metadata"],
    mounted() {
        this.overlayParent.style.width = `${this.image.width}px`;
        this.overlayParent.style.height = `${this.image.height}px`;
        this.reset();
        watchEffect(() => {
            this.overlay.style.left = `${Math.min(this.sx, this.ex)}px`;
            this.overlay.style.top = `${Math.min(this.sy, this.ey)}px`;
            this.overlay.style.width = `${Math.abs(this.ex - this.sx)}px`;
            this.overlay.style.height = `${Math.abs(this.ey - this.sy)}px`;
        })
        window.addEventListener("resize", () => this.onResize());
    },
    beforeUnmount() {
        window.removeEventListener("resize", () => this.onResize());
    },
    computed: {
        image() {
            return this.$refs.image as HTMLImageElement;
        },
        overlay() {
            return this.$refs.overlay as HTMLElement;
        },
        overlayParent() {
            return this.overlay.parentNode! as HTMLElement;
        }
    },
    methods: {
        getOffset(event: MouseEvent)
        {
            let canvasPos = this.image.getBoundingClientRect();
            return [Math.max(0, Math.min(canvasPos.width, event.clientX - canvasPos.x)), Math.max(0, Math.min(canvasPos.height, event.clientY - canvasPos.y))];
        },
        onResize() {
            // Wait until we're setup.
            if (!this.overlayParent)
                return;
            this.overlayParent.style.width = `${this.image.width}px`;
            this.overlayParent.style.height = `${this.image.height}px`;
            this.reset();
        },
        async onMouseDown(event: MouseEvent) {
            this.ex = this.sx = event.offsetX;
            this.ey = this.sy = event.offsetY;
            this.active = true;
            event.preventDefault();
        },
        async onMouseMove(event: MouseEvent) {
            if (!this.active)
                return;
            [this.ex, this.ey] = this.getOffset(event);
        },
        async onMouseUp(event: MouseEvent) {
            this.active = false;
            if (this.ex === this.sx || this.ey === this.sy)
            {
                this.reset();
                return;
            }
        },
        reset() {
            this.sx = this.sy = 0;
            this.ex = this.image.width;
            this.ey = this.image.height;
        },
        async crop() {
            let c = document.createElement("canvas");
            let ctx = c.getContext("2d")!;
            c.width = Math.abs(this.ex - this.sx) / this.image.clientWidth * this.image.naturalWidth;
            c.height = Math.abs(this.ey - this.sy) / this.image.clientHeight * this.image.naturalHeight;
            ctx.drawImage(this.image,
                -Math.min(this.sx, this.ex) / this.image.clientWidth * this.image.naturalWidth,
                -Math.min(this.sy, this.ey) / this.image.clientHeight * this.image.naturalHeight
            );
            let data = (await fetch(c.toDataURL("image/png"))).url;
            this.$emit('close', data);
        }
    }
})
</script>
