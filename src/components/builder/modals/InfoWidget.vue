<template>
    <div class="lg:w-[400px] sm:w-2/5 w-auto" style="height:60%;">
        <div class="relative h-full">
            <button @click="$emit('close')" class="absolute right-0">X</button>
            <h2 class="text-center w-full">Info</h2>
            <div class="h-5/6 overflow-auto">
                <h3 class="text-center">{{ set.name }}</h3>
                <div class="flex flex-col items-center text-lg">
                    <div class="w-[75%]"><Chart :data="getChartData"></Chart></div>
                    <p>{{ set?.getNbBriqs() }} briqs on a {{ bounds[1] - bounds[0] }}x{{ bounds[3] - bounds[2] }}x{{ bounds[5] - bounds[4] }} canvas</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Chart from '@/components/Chart.vue';
import { SetData } from '@/builder/SetData';
import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {};
    },
    computed: {
        set() {
            return this.metadata.setData as SetData;
        },
        briqs() {
            return this.set.getAllBriqs();
        },
        bounds() {
            let x0 = 0, x1 = 0, y0 = 0, y1 = 1, z0 = 0, z1 = 1;
            for (let briq of this.briqs) {
                if (briq.position[0] > x1)
                    x1 = briq.position[0];
                else if (briq.position[0] < x0)
                    x0 = briq.position[0];
                if (briq.position[1] > y1)
                    y1 = briq.position[1];
                else if (briq.position[1] < y0)
                    y0 = briq.position[1];
                if (briq.position[2] > z1)
                    z1 = briq.position[2];
                else if (briq.position[2] < z0)
                    z0 = briq.position[2];
            }
            return [x0, x1, y0, y1, z0, z1];
        },
        getChartData() {
            let colors = {};
            for (let briq of this.briqs) {
                if (!(briq.color in colors))
                    colors[briq.color] = 0;
                colors[briq.color]++;
            }
            let sorted = Object.keys(colors).sort((a, b) => colors[b] - colors[a]);
            return {
                type: 'doughnut',
                data: {
                    labels: sorted,
                    datasets: [{
                        label: 'My First Dataset',
                        data: sorted.map(x => colors[x]),
                        backgroundColor: sorted,
                        hoverOffset: 4,
                    }],
                },
                options: {
                    plugins: {
                        legend: {
                            display: false,
                        }
                    }
                },
            };
        }
    },
    methods: {},
    props: ["metadata"],
    emits: ["close"],
    components: { Chart }
})
</script>
