<script setup lang="ts">
import Button from '../../generic/Button.vue'
import ColorPicker from '../modals/ColorPicker.vue';
import ColorManager from '../modals/ColorManager.vue';
</script>

<template>
    <!-- Flex to occupy width-->
        <div class="flex-1 overflow-auto">
    <div :class="'grid grid-rows-2 grid-flow-col gap-0.5 ' + (palette.getNbColors() < 20 ? ' md:flex md:flex-col' : ' md:grid-cols-3 md:grid-flow-row')">
        <div v-if="inputStore.currentInput.indexOf('place') !== -1" class="col-span-3 flex flex-col" v-for="value, key in availableNFTs" :key="key">
            <Btn class='h-5 min-h-0 shadow-md m-0 p-0 leading-3'
                :tooltip="'Place keystone'"
                @click="pickNFT(value)"
                :style="{
                    'backgroundColor': '#555555',
                    'border': (inputStore.currentInput == 'place_nft' ? '3px solid black' : '0px solid black') }"
                >
            Keystone
            </Btn>
        </div>

        <div class="flex flex-col" v-for="value, key in palette.colors" :key="key">
            <Btn class='h-5 min-h-0 shadow-md'
                :tooltip="'Select color ' + value"
                @click="pickColor(key)"
                :style="{
                    'backgroundColor': key,
                    'border': (inputStore.currentInput != 'place_nft' && currentColor === key ? '3px solid black' : '0px solid black') }"
                >
            </Btn>
        </div>
    </div>
    </div>
    <div class="flex-0 mx-1 md:mx-0 md:my-1 flex md:flex-col gap-0.5">
        <Btn @click="registerNewColor" tooltip="Add a new color to the curret palette.">New Color</Btn>
        <Btn @click="pushModal(ColorManager)" tooltip="Manage the color palette. Replace or delete colors.">Manage</Btn>
    </div>
</template>

<script lang="ts">
import { inputStore } from '../../../builder/inputs/InputStore';
import { palettesMgr } from '../../../builder/Palette';
import { pushModal } from '../../Modals.vue';
import { builderInputFsm } from "../../../builder/inputs/BuilderInput"
import type { ChainBriqs } from '@/builder/ChainBriqs';

import { defineComponent, toRef } from 'vue'
export default defineComponent({
    inject:["messages", "chainBriqs"],
    data() {
        return {
            currentColor: toRef(inputStore, 'currentColor'),
        }
    },
    computed: {
        inputStore() {
            return inputStore;
        },
        palette() {
            return palettesMgr.getCurrent();
        },
        availableNFTs() {
            let nfts = (this.chainBriqs as ChainBriqs).getNFTs();
            let briqs = this.$store.state.builderData.currentSet.getAllBriqs();
            let av = [];
            for (let nft of nfts)
            {
                if (!briqs.find(x => x.id === nft.token_id))
                    av.push(nft);
            }
            return av;
        }
    },
    methods:
    {
        pushModal,
        async registerNewColor(): Promise<void> {
            let result = await pushModal(ColorPicker, { color: this.currentColor }) as [string, string];
            if (!result)
                return;
            let [hex, name] = result;
            if (!this.palette.addColor(hex, name))
            {
                this.messages.pushMessage("Error while picking color: color " + hex + " already exists.");
                return await this.registerNewColor();
            }
            this.currentColor = hex;
        },
        pickColor : function(key: string) {
            this.currentColor = key;
            if (inputStore.currentInput === "place_nft")
                builderInputFsm.switchTo("place");
        },
        pickNFT(nft: any) {
            builderInputFsm.switchTo("place_nft", nft);
        }
    }
})
</script>

<style scoped>
</style>
