<template>
    <div
        class="fixed z-[100000] bg-grad-darker text-grad-lighter rounded pointer-events-none px-4 py-2 leading-normal shadow font-normal text-sm w-max whitespace-pre-line"
        :style="getPositionCSS"
        ref="tooltipDiv">
        {{ tooltip }}
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { messagesStore } from '../../Messages';

const INITIAL_DELAY = 400;
const RESET_DELAY = 50;
const MIN_DURATION = 500;

export default defineComponent({
    data() {
        return {
            tooltip: '',
            lastChange: Date.now(),
            timeout: undefined as number | undefined,
            show: false,
            posHack: 0,
            mx: 0,
            my: 0,
            dx: 0,
            dy: 0,
            listener: undefined as any,
        };
    },
    computed: {
        rawToltip() {
            return messagesStore.tooltip;
        },
        getPositionCSS() {
            this.show;
            this.posHack;
            this.tooltip;
            let ret = {
                left: `${this.mx + 10}px`,
                top: `${this.my + 10}px`,
                opacity: this.show ? 100 : 0,
            } as any;
            if (!this.$refs.tooltipDiv)
                return ret;
            const rect = this.$refs.tooltipDiv.getBoundingClientRect();
            if (this.mx > window.innerWidth - rect.width - 20)
                ret.left = `${window.innerWidth - rect.width - 20}px`;
            if (this.my > window.innerHeight - rect.height - 20)
                ret.top = `${window.innerHeight - rect.height - 20}px`;
            return ret;
        },
    },
    mounted() {
        window.addEventListener('mousemove', this.updateMousePos);
        window.addEventListener('mousedown', this.clear);
    },
    unmounted() {
        window.removeEventListener('mousemove', this.updateMousePos);
        window.addEventListener('mousedown', this.clear);
    },
    methods: {
        updateMousePos(event: MouseEvent) {
            this.dx = event.clientX;
            this.dy = event.clientY;
            this.mx = this.dx;
            this.my = this.dy;
        },
        clear() {
            this.lastChange = Date.now();
            clearTimeout(this.timeout);
            this.show = false;
        },
    },
    watch: {
        rawToltip(nv, ov) {
            let time = Date.now();
            let delta = time - this.lastChange;
            if (this.show && !nv)
                if (delta > MIN_DURATION) {
                    this.lastChange = Date.now();
                    this.show = false;
                } else {
                    clearTimeout(this.timeout);
                    this.timeout = setTimeout(() => {
                        this.lastChange = Date.now();
                        this.show = false;
                    }, MIN_DURATION) as unknown as number;
                }
            else if (!this.show && nv && delta > RESET_DELAY) {
                this.lastChange = time;
                clearTimeout(this.timeout);
                this.timeout = setTimeout(() => {
                    this.show = true;
                    this.tooltip = nv;
                    this.mx = this.dx;
                    this.my = this.dy;
                    this.lastChange = Date.now();
                }, INITIAL_DELAY) as unknown as number;
            } else if ((this.show || delta <= RESET_DELAY) && nv) {
                clearTimeout(this.timeout);
                this.show = true;
                this.tooltip = nv;
                this.mx = this.dx;
                this.my = this.dy;
                this.lastChange = Date.now();
            } else
                clearTimeout(this.timeout);
        },
        tooltip() {
            setTimeout(() => this.posHack += 1, 0);
        },
    },
});
</script>
