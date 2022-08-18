import { takeScreenshot as takeBuilderScreenshot } from '@/builder/graphics/Builder';
import { ref } from 'vue';
import { pushModal } from '../Modals.vue';

import CropScreenshotVue from '@/components/builder/modals/CropScreenshot.vue';
import ScreenshotVue from '@/components/builder/modals/Screenshot.vue';


export function useScreenshotHelpers(screenshot?: string, ogImage?: string) {
    const previewImage = ref(screenshot);
    const originalImage = ref(ogImage || screenshot);

    const imageProcessing = ref(undefined as undefined | Promise<typeof previewImage.value>);

    const takeScreenshot = async() => {
        const img = new Image();
        img.src = takeBuilderScreenshot();
        return img;
    }

    const updateImage = async(image: HTMLImageElement, updateOriginal = false) => {
        await image.decode();
        originalImage.value = image.src;
        imageProcessing.value = prepareImage(image);
        previewImage.value = await imageProcessing.value;
    }

    const prepareImage = async(img: HTMLImageElement): Promise<string> => {
        const c = document.createElement('canvas');
        const ctx = c.getContext('2d')!;
        const ratio = Math.min(1, Math.min(800 / img.width, 600 / img.height));

        c.width = Math.floor(img.width * ratio);
        c.height = Math.floor(img.height * ratio);

        // Prevent images from being too tall by adding transparent sides.
        const whRatio = img.width / img.height;
        let imgBlitStart = 0;
        if (whRatio < 0.75) {
            imgBlitStart = (c.height * 0.75 - c.width) / 2.0 / ratio;
            c.width = c.height * 0.75;
        }

        ctx.scale(ratio, ratio);
        ctx.drawImage(img, imgBlitStart, 0);
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
        takeScreenshot, updateImage, prepareImage, retakeScreenshot, cropScreenshot,
    }
}