<template>
    <canvas ref="chart"></canvas>
</template>
<script lang="ts">
var chart = import('chart.js/auto');
import { defineComponent } from "vue";
export default defineComponent({
    props:["data"],
    async mounted() {
        const ctx = this.$refs.chart.getContext('2d');
        await chart;
        const myChart = new (await chart).default(ctx, this.data);
    } 
});
</script>