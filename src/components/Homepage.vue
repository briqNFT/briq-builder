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
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
  margin-left: auto;
  margin-right: auto;
  border-radius: 0px;
}

</style>
