<template>
    <Window @close="$emit('close')" class="!w-auto">
        <template #big-title>Download set</template>
        <div class="sm:w-max m-auto flex items-stretch flex-col font-medium gap-6 py-4 px-2">
            <div class="text-center">
                <Btn @click="downloadBriq">Download as .json</Btn>
                <p class="text-sm">This format is specific to briq and can be used to import the set.</p>
            </div>
            <div class="text-center">
                <Btn @click="downloadGLB">Download as .glb</Btn>
                <p class="text-center text-sm">GLB is binary GTLF, a modern open standard for 3D meshes.<br/>You can use this to import the set in other 3D worlds.</p>
            </div>
            <div class="text-center">
                <Btn @click="downloadVox">Download as .vox</Btn>
                <p class="text-center text-sm">Vox is the format used by MagicaVoxel and supported by most voxel editors.</p>
            </div>
        </div>
    </Window>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import getBaseUrl, { doDownload } from '../../../url';
export default defineComponent({
    data() {
        return {
        }
    },
    props: ["metadata"],
    mounted() {
    },
    computed: {
        setId() {
            return this.metadata.setId;
        }
    },
    methods: {
        async downloadBriq() {
            doDownload(`${getBaseUrl()}/store_get/${this.setId}`, `${this.setId}.json`);
        },
        async downloadGLB() {
            doDownload(`${getBaseUrl()}/get_model/${this.setId}.glb`, `${this.setId}.glb`);
        },
        async downloadVox() {
            doDownload(`${getBaseUrl()}/get_model/${this.setId}.vox`, `${this.setId}.vox`);
        },
    },
})
</script>