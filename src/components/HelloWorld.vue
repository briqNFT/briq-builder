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

html, body {
  height: 100%;
  margin: 0;
}

#backgroundgl {
  width: 95%;
  height: 100%;
  display: block;
  margin-left: auto;
  margin-right: auto;
  border-radius: 15px;
}

</style>
