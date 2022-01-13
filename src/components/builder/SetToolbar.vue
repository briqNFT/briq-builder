<template>
    <div v-if="!forceInput" class="invisible absolute top-0 w-screen flex py-2 md:py-4 md:px-0 px-4">
        <!-- For easy placement, have invisible blocks for the left/right hand side items -->
        <div class="w-[16rem] flex-none hidden md:block"></div>
        <div class="w-full flex-shrink visibleChildren">
            <div class="flex justify-center">
                <div class="flex justify-end flex-1 lg:flex-row flex-col items-end gap-2">
                    <!--
                    <div class="flex-1 flex gap-1 mx-2 flex-wrap justify-center lg:justify-end">
                        <div class="flex justify-stretch gap-1">
                            <Btn class="w-12" tooltip="Create a new WIP set." @click="newSet"><i class="far fa-file"></i></Btn>
                            <Btn class="w-12" tooltip="Copy a new WIP set." @click="copySet"><i class="far fa-copy"></i></Btn>
                        </div>
                        <div class="flex justify-stretch gap-1">
                            <Btn class="w-12" tooltip="Delete the current WIP set." @click="deleteSet"><i class="far fa-trash-alt"></i></button>
                            <Btn class="w-12" tooltip="Import a local set." @click="importSet"><i class="fas fa-file-import"></i></button>
                        </div>
                    </div>
                    -->
                    <div class="justify-self-end flex-none">
                        <Btn v-if="setInfo?.status !== 'ONCHAIN_LOADED'" tooltip="Save your set on-chain to share it with others" :disabled="true"><i class="fas fa-share-square"></i> Copy Sharing Link</Btn>
                        <Btn v-if="setInfo?.status === 'ONCHAIN_LOADED'" tooltip="This link will let you share your briq creation with others" @click="copyShareLink"><i class="fas fa-share-square"></i> Copy Sharing Link</Btn>
                    </div>
                    <div class="justify-self-end flex-none">
                        <Btn v-if="setInfo?.status === 'ONCHAIN_LOADED'" tooltip="This set is already on-chain" :disabled="true"><i class="fas fa-cloud-upload-alt"></i> Mint on Chain</Btn>
                        <Btn v-if="setInfo?.status !== 'ONCHAIN_LOADED'" tooltip="Mint your set as an NFT on-chain" :disabled="!$store.state.builderData.currentSet.briqsDB.briqs.size" @click="mintSet"><i class="fas fa-cloud-upload-alt"></i> Mint on Chain</Btn>
                    </div>
                </div>
            </div>
        </div>
        <div class="lg:w-[20rem] w-[11rem] flex-none hidden md:block"></div>
    </div>
</template>

<style scoped>
.visibleChildren * {
    @apply invisible;
}
.visibleChildren >>> button, .visibleChildren >>> button * {
    @apply visible;
}

</style>

<script setup lang="ts">
</script>

<script lang="ts">
import { pushModal } from '../Modals.vue';

import { setsManager } from '../../builder/SetsManager';
import ExportSetVue from './modals/ExportSet.vue';
import { inputStore } from '../../builder/inputs/InputStore';

import { defineComponent } from 'vue';
export default defineComponent({
    inject: ["messages"],
    computed: {
        setInfo() {
            return setsManager.getInfo(this.$store.state.builderData.currentSet.id);
        },
        forceInput() {
            return inputStore.forceInput;
        }
    },
    methods: {
        async mintSet() {
            await pushModal(ExportSetVue, { set: this.$store.state.builderData.currentSet.id });
        },
        copyShareLink() {
            let network = this.$store.state.wallet.baseUrl.indexOf("mainnet") !== -1 ? "mainnet" : "testnet";
            navigator.clipboard.writeText(`${window.location.hostname}/share?set_id=${this.$store.state.builderData.currentSet.id}&network=${network}&version=1`);
            this.messages.pushMessage("Copied sharing link to clipboard");
        },
    }
})
</script>
