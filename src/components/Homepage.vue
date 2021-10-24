<template>
    <canvas id="backgroundgl" ref="canvas">
    </canvas>
</template>

<script lang="ts">
    import { main } from "../builder.js"

    import { defineComponent } from 'vue';
    export default defineComponent({
        async mounted() {
            main(this.$refs.canvas);
    ;    },
        inject: ["contract"]
    });
</script>

<style scoped>
#backgroundgl {
  width: 100%;
  height: 100vh;
  display: block;
  padding:0;
  margin:0;
}

</style>
