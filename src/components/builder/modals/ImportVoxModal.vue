<template>
    <div class="w-auto">
        <div class="relative">
            <button @click="$emit('close')" class="absolute right-0">X</button>
            <h2 class="text-center">Import .vox file</h2>
            <div class="w-full text-lg">
                <template v-if="!set">
                    <h3>There was an error while loading "{{ file.name }}"</h3>
                    <p class="bg-accent rounded-md font-mono text-sm px-2 py-1 my-2">
                        {{ error }}
                        <Btn class="text-sm" @click="copyError"><i class="fas fa-copy"></i></Btn>
                    </p>
                </template>
                <template v-else="">
                    <h3>Set Name</h3>
                    <p><input type="text" v-model="set.name" maxlength="200" size="80"/></p>
                    <p>Made of {{ set.getAllBriqs().length }} briqs.</p>
                    <p>All briqs will be loaded with the standard material.</p>
                    <p class="text-md italic">Disclaimer: importing .vox files may be lossy, as briq does not support all functionality of that format.</p>
                    <p v-if="loader?.warnings?.length" class="bg-accent rounded-md font-mono text-sm px-2 py-1 my-2 max-h-40 overflow-auto">
                        <Btn class="float-right text-sm" @click="copyError"><i class="fas fa-copy"></i></Btn>
                        <span class="font-bold">Some warnings while importing</span><br/>
                        <span v-for="warning in loader?.warnings">{{ warning }}<br/></span>
                    </p>
                    <Btn class="float-right" @click="importSet">Import</Btn>
                </template>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import type { SetData } from '@/builder/SetData';
import { dispatchBuilderAction } from '@/builder/graphics/Dispatch';
import { setsManager } from '@/builder/SetsManager';
import { VoxLoader } from '@/builder/VoxLoader';

import { defineComponent } from 'vue';
import builderSettings from '@/builder/graphics/Settings';
import { pushMessage } from '@/Messages';
export default defineComponent({
    data() {
        return {
            loader: undefined as VoxLoader | undefined,
            set: undefined as SetData | undefined,
            error: undefined as any,
        }
    },
    props: ["metadata"],
    emits: ["close"],
    async mounted() {
        try {
            this.loader = new VoxLoader(await this.data);
            this.set = this.loader.set;
            this.set.name = this.file.name.replace(".vox", "");
        }
        catch (err)
        {
            console.error(err);
            this.error = err;
        }
    },
    computed: {
        file() {
            return this.metadata.file as File;
        },
        data() {
            return this.metadata.fileData as Promise<ArrayBuffer>;
        }
    },
    methods: {
        importSet() {
            setsManager.registerLocalSet(this.set);
            // Things are placed centered
            let maxV = 0;
            this.set?.forEach((_, pos) => {
                maxV = Math.max(maxV, pos[0], pos[2]);
            });
            builderSettings.canvasSize = Math.ceil(maxV / 5) * 5;
            this.$store.dispatch("builderData/select_set", this.set.id);
            dispatchBuilderAction("put_all_in_view");
            this.$emit('close');
        },
        copyError() {
            navigator.clipboard.writeText(this.error);
            pushMessage("Error copied to clipboard");
        }
    },
})
</script>