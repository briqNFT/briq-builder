<script setup lang="ts">
import Slider from '@/components/generic/Slider.vue';
import { showOpenFilePickerPolyfill } from '@/UploadFilePolyfill';
import { watchEffect, ref } from 'vue';

const rawImageData = ref(null as unknown as HTMLImageElement);

const openFile = async () => {
    let fileHandles = await showOpenFilePickerPolyfill();
    for (let fileHandle of fileHandles)
        try {
            let file = await fileHandle.getFile();
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.src = ev.target.result;
                rawImageData.value = img;
                console.log(rawImageData.value);
            }
            reader.readAsDataURL(file);
        } catch(_) {}
}

const canvas = ref(null as unknown as HTMLCanvasElement);

const pixelSize = ref(1);
const pixelShiftX = ref(0);
const pixelShiftY = ref(0);

watchEffect(() => {
    if (!rawImageData.value)
        return;
    canvas.value.width = rawImageData.value.width;
    canvas.value.height = rawImageData.value.height;
    let ctx = canvas.value!.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    const width = canvas.value.width;
    const height = canvas.value.height;
    const scaledWidth = Math.ceil(canvas.value.width / pixelSize.value);
    const scaledHeight = Math.ceil(canvas.value.height / pixelSize.value);
    ctx.drawImage(rawImageData.value,
                  pixelShiftX.value, pixelShiftY.value, canvas.value.width, canvas.value.height,
                  0, 0, scaledWidth, scaledHeight);

    const circleSize = Math.floor(Math.min(width, height) / pixelSize.value / 2);
    const imageData = ctx.getImageData(0, 0, scaledWidth, scaledHeight);
    for (let x = 0; x < scaledWidth; x++)
        for (let y = 0; y < scaledHeight; y++) {
            const dist = (scaledWidth / 2 - x) ** 2 + (scaledHeight / 2 - y) ** 2;
            if (dist > circleSize * circleSize)
                imageData.data[y * scaledWidth * 4 + x * 4 + 3] = 0.0;
        }
    ctx.putImageData(imageData, 0, 0, 0, 0, scaledWidth, scaledWidth);

    ctx.drawImage(canvas.value,
                  0, 0, canvas.value.width / pixelSize.value, canvas.value.height / pixelSize.value,
                  0, 0, canvas.value.width, canvas.value.height);
})

</script>

<template>
    <div class="container m-auto">
        <Btn @click="openFile">Import</Btn>
        <canvas ref="canvas"/>
        <Slider class="w-40" :min="1" :max="Math.min(rawImageData?.width ?? 32, rawImageData?.height ?? 32)" v-model="pixelSize"/>Pixel size
        <Slider class="w-40" :min="-Math.floor(pixelSize/2) + 1" :max="Math.floor(pixelSize/2) - 1" v-model="pixelShiftX"/>Pixel shift X
        <Slider class="w-40" :min="-Math.floor(pixelSize/2) + 1" :max="Math.floor(pixelSize/2) - 1" v-model="pixelShiftY"/>Pixel shift Y
    </div>
</template>
