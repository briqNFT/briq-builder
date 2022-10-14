<script setup lang="ts">
import { backendManager } from '@/Backend';
import { getCurrentNetwork } from '@/chain/Network';
import getBaseUrl, { doDownload, downloadJSON } from '../../../url';

const props = defineProps<{
    setId: string
}>();

const downloadBriq = async () => {
    return downloadJSON(await backendManager.fetch(`v1/metadata/${getCurrentNetwork()}/${props.setId}.json`), `${props.setId}.json`);
};
const downloadGLB = () => doDownload(backendManager.getRoute(`model/${getCurrentNetwork()}/${props.setId}.glb`), `${props.setId}.glb`);
const downloadVox = () => doDownload(backendManager.getRoute(`model/${getCurrentNetwork()}/${props.setId}.vox`), `${props.setId}.vox`);
</script>

<template>
    <Window class="!w-auto">
        <template #big-title>Download set</template>
        <div class="sm:w-max m-auto flex items-stretch flex-col font-medium gap-6 py-4 px-2">
            <div class="text-center">
                <Btn secondary @click="downloadBriq">Download as .json</Btn>
                <p class="my-2 text-sm">This format is specific to briq and can be used to import the set.</p>
            </div>
            <div class="text-center">
                <Btn secondary @click="downloadGLB">Download as .glb</Btn>
                <p class="my-2 text-center text-sm">
                    GLB is binary GTLF, a modern open standard for 3D meshes.<br>You can use this to import the set in
                    other 3D worlds.
                </p>
            </div>
            <div class="text-center">
                <Btn secondary @click="downloadVox">Download as .vox</Btn>
                <p class="my-2 text-center text-sm">
                    Vox is the format used by MagicaVoxel and supported by most voxel editors.
                </p>
            </div>
        </div>
    </Window>
</template>
