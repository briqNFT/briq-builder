<template>
    <div class="md:w-3/5 w-auto">
        <div class="relative">
            <button @click="$emit('close')" class="absolute right-0">X</button>
            <h3 class="text center w-full">Crop Screenshot</h3>
            <div class="relative">
                <img ref="image" @mousedown="onMouseDown" @mousemove="onMouseMove" @mouseup="onMouseUp" :src="metadata.screenshot"/>
                <div class="absolute top-0 left-0 pointer-events-none overflow-hidden">
                    <div ref="overlay" class="outline-black outline opacity-50 outline-[5000px] absolute top-0 left-0">
                    </div>
                </div>
            </div>
            <Btn class="my-2 float-right" @click="crop">Crop</Btn>
        </div>
    </div>
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
    emits: ["close"],
    mounted() {
        this.$refs.overlay.parentNode.style.width = `${this.$refs.image.width}px`;
        this.$refs.overlay.parentNode.style.height = `${this.$refs.image.height}px`;
        this.reset();
        watchEffect(() => {
            this.$refs.overlay.style.left = `${this.sx}px`;
            this.$refs.overlay.style.top = `${this.sy}px`;
            this.$refs.overlay.style.width = `${this.ex - this.sx}px`;
            this.$refs.overlay.style.height = `${this.ey - this.sy}px`;
        })
        window.addEventListener("resize", () => this.onResize());
    },
    beforeUnmount() {
        window.removeEventListener("resize", () => this.onResize());
    },
    methods: {
        onResize() {
            this.$refs.overlay.parentNode.style.width = `${this.$refs.image.width}px`;
            this.$refs.overlay.parentNode.style.height = `${this.$refs.image.height}px`;
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
            this.ex = event.offsetX;
            this.ey = event.offsetY;
            if (this.ex < this.sx)
                this.ex = this.sx;
            if (this.ey < this.sy)
                this.ey = this.sy;
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
            this.ex = this.$refs.image.width;
            this.ey = this.$refs.image.height;
        },
        async crop() {
            let c = document.createElement("canvas");
            let ctx = c.getContext("2d")!;
            console.log("out:", this.ex - this.sx, this.ey - this.sy);
            c.width = (this.ex - this.sx) / this.$refs.image.clientWidth * this.$refs.image.naturalWidth;
            c.height = (this.ey - this.sy) / this.$refs.image.clientHeight * this.$refs.image.naturalHeight;
            ctx.drawImage(this.$refs.image,
                -this.sx / this.$refs.image.clientWidth * this.$refs.image.naturalWidth,
                -this.sy / this.$refs.image.clientHeight * this.$refs.image.naturalHeight
            );
            let data = (await fetch(c.toDataURL("image/png"))).url;
            this.$emit('close', data);
        }
    }
})
</script>
