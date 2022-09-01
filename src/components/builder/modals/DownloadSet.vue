<script setup lang="ts">
import { backendManager } from '@/Backend';
import { setsManager } from '@/builder/SetsManager';
import getBaseUrl, { doDownload, downloadJSON } from '../../../url';
import { useBuilder } from '../BuilderComposable';

const props = defineProps<{
    setId: string
}>();

const { chainSets } = useBuilder();

const localSet = setsManager.getInfo(props.setId)?.getSet();
const chainSet = chainSets.setData?.[props.setId];

const downloadBriq = async () => {
    if (!chainSet)
        return downloadJSON(localSet.serialize(), `${localSet.getName()}.json`)
    return downloadJSON(await backendManager.fetch(`${getBaseUrl()}/v1/metadata/starknet-testnet-legacy/${props.setId}.json`), `${props.setId}.json`);
};
const downloadGLB = () => doDownload(`${getBaseUrl()}/get_model/${props.setId}.glb`, `${props.setId}.glb`);
const downloadVox = () => doDownload(`${getBaseUrl()}/get_model/${props.setId}.vox`, `${props.setId}.vox`);
</script>

<template>
    <Window class="!w-auto">
        <template #big-title>Download set</template>
        <div class="sm:w-max m-auto flex items-stretch flex-col font-medium gap-6 py-4 px-2">
            <div class="text-center">
                <Btn @click="downloadBriq">Download as .json</Btn>
                <p class="text-sm">This format is specific to briq and can be used to import the set.</p>
            </div>
            <template v-if="chainSet">
                <div class="text-center">
                    <Btn @click="downloadGLB">Download as .glb</Btn>
                    <p class="text-center text-sm">
                        GLB is binary GTLF, a modern open standard for 3D meshes.<br>You can use this to import the set in
                        other 3D worlds.
                    </p>
                </div>
                <div class="text-center">
                    <Btn @click="downloadVox">Download as .vox</Btn>
                    <p class="text-center text-sm">
                        Vox is the format used by MagicaVoxel and supported by most voxel editors.
                    </p>
                </div>
            </template>
        </div>
    </Window>
</template>
