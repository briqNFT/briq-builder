<template>
    <canvas id="backgroundgl" ref="canvas" v-on:pointermove="onPointerMove" v-on:pointerdown="onPointerDown"  v-on:pointerup="onPointerUp">
    </canvas>
</template>

<script lang="ts">
import { builderInputFsm, main, getCameraRay, voxWorld } from "../builder.js"
import { picker } from "../materials.js"
import { defineComponent } from 'vue';

import { BuilderInputState } from '../BuilderInput';
import { previewCube } from '../PreviewCube'

class PlacerInput extends BuilderInputState {
    curX: number;
    curY: number;
    lastX: number;
    lastY: number;

    lastClickX: number;
    lastClickY: number;

    canvas: HTMLCanvasElement;

    constructor(canvas)
    {
        super();
        this.canvas = canvas;
    }

    getCanvasRelativePosition(x: number, y: number): [number, number]
    {
        const rect = this.canvas.getBoundingClientRect();
        return [
            (this.curX - rect.left) / rect.width * this.canvas.width / rect.width,
            (this.curY - rect.top) / rect.height * this.canvas.height / rect.height
        ]
    }

    onPointerMove(event: PointerEvent)
    {
        this.lastX = this.curX;
        this.lastY = this.curY;
        this.curX = event.clientX;
        this.curY = event.clientY;

        let [start, end] = getCameraRay(...this.getCanvasRelativePosition(this.curX, this.curY));
        const intersection = voxWorld.intersectRay(start, end);
        if (intersection)
        {
            const pos = intersection.position.map((v, ndx) => {
                return v + intersection.normal[ndx] * (event.shiftKey ? -0.5 : +0.5);
            });
            if (event.shiftKey)
                previewCube.visible = false;
            else
            {
                previewCube.visible = true;
                previewCube.position.set(Math.floor(pos[0]) + 0.5, Math.floor(pos[1]) + 0.5, Math.floor(pos[2]) + 0.5);
            }
        }
    }

    onPointerDown(event: PointerEvent)
    {
        this.lastClickX = event.clientX;
        this.lastClickY = event.clientY;
    }

    onPointerUp(event: PointerEvent)
    {
        let mov = Math.abs(event.clientX - this.lastClickX) + Math.abs(event.clientY - this.lastClickY);
        if (mov > 10)
            return;
        let [start, end] = getCameraRay(...this.getCanvasRelativePosition(this.curX, this.curY));
        const intersection = voxWorld.intersectRay(start, end);
        if (intersection) {
            const voxelId = event.shiftKey ? 0 : picker.material;
            // the intersection point is on the face. That means
            // the math imprecision could put us on either side of the face.
            // so go half a normal into the voxel if removing (pickerMaterial = 0)
            // our out of the voxel if adding (pickerMaterial  > 0)
            const pos = intersection.position.map((v, ndx) => {
                return v + intersection.normal[ndx] * (voxelId > 0 ? 0.5 : -0.5);
            });
            voxWorld.setVoxel(...pos, voxelId);
            voxWorld.updateVoxelGeometry(...pos);
        }
    }
}

export default defineComponent({
    async mounted() {
        main(this.$refs.canvas);
        builderInputFsm.switchTo(new PlacerInput(this.$refs.canvas));
    },
    methods: {
        onPointerMove: function(event) {
            builderInputFsm.onPointerMove(event);
        },
        onPointerDown: function(event) {
            builderInputFsm.onPointerDown(event);
        },
        onPointerUp: function(event) {
            builderInputFsm.onPointerUp(event);
        }
    }
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
