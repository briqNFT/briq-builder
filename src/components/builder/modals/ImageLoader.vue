<script setup lang="ts">
import { Briq } from '@/builder/Briq';
import { SetData } from '@/builder/SetData';
import Slider from '@/components/generic/Slider.vue';
import { hexUuid } from '@/Uuid';
import { watchEffect, ref } from 'vue';
import { useSetHelpers } from '@/components/builder/SetComposable';
import { setsManager } from '@/builder/SetsManager';

const { saveSetAndOpen } = useSetHelpers();

const emit = defineEmits(['close']);

const props = defineProps<{
    file: File,
    data: Promise<ArrayBuffer>,
}>();


const rawImageData = ref(null as unknown as HTMLImageElement);

const loadImage = async () => {
    const blob = new Blob([await props.data], { type: props.file.type });
    console.log('totoro', blob);
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
        URL.revokeObjectURL(url);
        rawImageData.value = image;
    };
    image.src = url;
}
loadImage();

const name = ref(props.file.name);

const canvas = ref(null as unknown as HTMLCanvasElement);
const canvas2 = ref(null as unknown as HTMLCanvasElement);

const pixelSize = ref(1);
const pixelShiftX = ref(0);
const pixelShiftY = ref(0);


watchEffect(() => {
    if (!rawImageData.value || !canvas.value || !canvas2.value)
        return;

    const width = rawImageData.value.width;
    const height = rawImageData.value.height;
    const scaledWidth = Math.ceil(rawImageData.value.width / pixelSize.value);
    const scaledHeight = Math.ceil(rawImageData.value.height / pixelSize.value);

    canvas.value.width = scaledWidth;
    canvas.value.height = scaledHeight;

    let ctx = canvas.value!.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    ctx.drawImage(rawImageData.value,
                  pixelShiftX.value, pixelShiftY.value, rawImageData.value.width, rawImageData.value.height,
                  0, 0, scaledWidth, scaledHeight,
    );

    canvas2.value.width = width;
    canvas2.value.height = height;
    console.log(width, height)
    let ctx2 = canvas2.value!.getContext('2d')!;

    ctx2.imageSmoothingEnabled = false;
    ctx2.drawImage(canvas.value,
                   0, 0, scaledWidth, scaledHeight,
                   0, 0, width, height);
    /*
    const circleSize = Math.floor(Math.min(width, height) / 2);
    const imageData = ctx2.getImageData(0, 0, width, height);
    for (let x = 0; x < width; x++)
        for (let y = 0; y < height; y++) {
            const dist = (width / 2 - x) ** 2 + (height / 2 - y) ** 2;
            if (dist > circleSize * circleSize)
                imageData.data[y * width * 4 + x * 4 + 3] = 0.0;
        }
    ctx2.putImageData(imageData, 0, 0, 0, 0, width, height);
    */
})

const toBriq = () => {
    const ctx = canvas.value.getContext('2d')!;

    const width = canvas.value.width;
    const height = canvas.value.height;

    const data = new SetData(hexUuid());
    data.name = name.value;

    const imageData = ctx.getImageData(0, 0, width, height).data;
    for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;

            const r = imageData[idx];
            const g = imageData[idx + 1];
            const b = imageData[idx + 2];
            const a = imageData[idx + 3];
            if (a > 0.1)
                data.placeBriq(x, height-y, 0, new Briq('0x1', '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')))
        }
    setsManager.registerLocalSet(data);
    saveSetAndOpen(data);
    emit('close');
}

</script>

<template>
    <Window class="!w-auto">
        <template #big-title>Import image</template>
        <div class="w-max lg:min-w-[600px]">
            <div class="mb-4">
                <p class="mb-2">Set name</p>
                <input type="text" placeholder="Enter the name of your set" v-model="name" class="w-full">
            </div>
            <canvas ref="canvas" class="hidden"/>
            <div class="flex justify-center items-center">
                <canvas ref="canvas2" class="max-w-[600px] max-h-[400px]"/>
            </div>
            <div>
                <div class="flex flex-1 items-center flex-col mt-2">
                    Downscale factor
                    <Slider class="mb-1" :min="1" :max="Math.min((rawImageData?.width || 32) / 4, (rawImageData?.height || 32) / 4)" v-model="pixelSize"/>
                </div>
                <div class="flex">
                    <div class="flex flex-1 items-center flex-col">
                        Horizontal shift
                        <Slider :min="Math.min(0, -Math.ceil(pixelSize/2) + 1)" :max="Math.floor(pixelSize/2)" v-model="pixelShiftX"/>
                    </div>
                    <div class="flex flex-1 items-center flex-col">
                        Vertical shift
                        <Slider :min="Math.min(0, -Math.ceil(pixelSize/2) + 1)" :max="Math.floor(pixelSize/2)" v-model="pixelShiftY"/>
                    </div>
                </div>
            </div>
            <div class="mt-4 flex justify-between items-center gap-8">
                <p>
                    Total number of briqs: {{ canvas?.width * canvas?.height || 0 }}
                    <span v-if="(canvas?.width * canvas?.height || 0) > 5000" class="text-xs"><br>
                        <i class="fas fa-exclamation-triangle text-info-error"/>
                        Importing such a large image may be very slow
                    </span>
                </p>
                <Btn @click="toBriq" :disabled="!canvas">Import</Btn>
            </div>
        </div>
    </Window>
</template>
