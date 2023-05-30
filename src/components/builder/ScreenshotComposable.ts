import { camera } from '@/builder/graphics/Builder';
import { ref } from 'vue';
import { pushModal } from '../Modals.vue';

import CropScreenshotVue from '@/components/builder/modals/CropScreenshot.vue';
import ScreenshotVue from '@/components/builder/modals/Screenshot.vue';
import { HighQualityScreenshot } from './genesis/HighQualityScreenshot';


export function useScreenshotHelpers(screenshot?: string, ogImage?: string) {
    const previewImage = ref(screenshot);
    const originalImage = ref(ogImage || screenshot);

    const imageProcessing = ref(undefined as undefined | Promise<typeof previewImage.value>);

    const takeScreenshot = async(object: any, defaultCamera = false) => {
        const img = new Image();
        img.src = await (new HighQualityScreenshot(object, 750*2, 1000*2)).takeScreenshot(!defaultCamera ? camera : undefined);
        return img;
    }

    const updateImage = async(image: HTMLImageElement, updateOriginal = false) => {
        await image.decode();
        originalImage.value = image.src;
        imageProcessing.value = prepareImage(image);
        previewImage.value = await imageProcessing.value;
    }

    const forceImage = async(image: HTMLImageElement) => {
        await image.decode();
        originalImage.value = image.src;
        previewImage.value = image.src;
    }
    const prepareImage = async(img: HTMLImageElement): Promise<string> => {
        const c = document.createElement('canvas');
        const ctx = c.getContext('2d')!;
        const ratio = Math.min(1, Math.min(800 / img.width, 1000 / img.height));

        c.width = Math.floor(img.width * ratio);
        c.height = Math.floor(img.height * ratio);

        // Prevent images from being too tall by adding transparent sides.
        const whRatio = img.width / img.height;
        const blit = [0, 0];
        if (whRatio < 0.75) {
            blit[0] = (c.height * 0.75 - c.width) / 2.0 / ratio;
            c.width = c.height * 0.75;
        } else if (whRatio > 0.75) {
            blit[1] = (c.width / 0.75 - c.height) / 2.0 / ratio;
            c.height = c.width / 0.75;
        }

        ctx.scale(ratio, ratio);
        ctx.drawImage(img, ...blit);
        return (await fetch(c.toDataURL('image/png'))).url;
    };

    const retakeScreenshot = async () => {
        const img = new Image();
        const url = (await pushModal(ScreenshotVue, { background: false })) as string;
        // Nothing to do if we cancelled.
        if (!url)
            return;
        img.src = url;
        updateImage(img, true);
    };
    const cropScreenshot = async ()=> {
        const img = new Image();
        const url = (await pushModal(CropScreenshotVue, { screenshot: originalImage.value })) as string;
        // Nothing to do if we cancelled.
        if (!url)
            return;
        img.src = url;
        updateImage(img);
    };
    return {
        previewImage, originalImage, imageProcessing,
        takeScreenshot, updateImage, forceImage, prepareImage, retakeScreenshot, cropScreenshot,
    }
}