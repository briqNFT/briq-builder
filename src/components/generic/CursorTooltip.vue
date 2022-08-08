<script setup lang="ts">
import { ref } from 'vue';

const positionHack = ref(false);
const vMounted = {
    mounted: (el: HTMLElement) => {
        positionHack.value = !positionHack.value;
    },
}

</script>
<template>
    <div
        v-if="show"
        class="fixed bg-primary rounded pointer-events-none px-2 py-1 shadow font-medium text-sm w-max"
        :style="getPositionCSS"
        ref="tooltipDiv"
        v-mounted>
        {{ tooltip }}
    </div>
</template>

<script lang="ts">
import { defineComponent, nextTick } from 'vue';
import { messagesStore } from '../../Messages';

const INITIAL_DELAY = 300;
const RESET_DELAY = 50;
const MIN_DURATION = 500;

export default defineComponent({
    data() {
        return {
            tooltip: '',
            lastChange: Date.now(),
            timeout: undefined as number | undefined,
            show: false,
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
            this.positionHack;
            let ret = {
                left: `${this.mx + 10}px`,
                top: `${this.my + 10}px`,
            } as any;
            if (!this.$refs.tooltipDiv)
                return ret;
            const rect = this.$refs.tooltipDiv.getBoundingClientRect();
            if (this.mx > window.innerWidth - rect.width - 10)
                ret.left = `${window.innerWidth - rect.width}px`;
            if (this.my > window.innerHeight - rect.height - 10)
                ret.top = `${window.innerHeight - rect.height}px`;
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
            if (!this.show)
                return;
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
    },
});
</script>
