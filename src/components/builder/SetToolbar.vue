<template>
    <div class="invisible absolute md:top-0 bottom-0 w-screen flex py-2 md:py-4">
        <!-- For easy placement, have invisible blocks for the left/right hand side items -->
        <div class="w-[16rem] flex-none md:block hidden"></div>
        <div class="w-full flex-shrink visibleChildren">
            <div class="flex justify-center">
                <div class="flex justify-center md:justify-end flex-1">
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
                    <div class="mx-2 justify-center lg:justify-self-end flex-none">
                        <Btn v-if="setInfo?.status !== 'ONCHAIN_LOADED'" tooltip="Save your set on-chain to share it with others" :disabled="true"><i class="fas fa-share-square"></i> Copy Sharing Link</Btn>
                        <Btn v-if="setInfo?.status === 'ONCHAIN_LOADED'" tooltip="This link will let you share your briq creation with others" @click="copyShareLink"><i class="fas fa-share-square"></i> Copy Sharing Link</Btn>
                    </div>
                    <div class="mx-2 justify-center lg:justify-self-end flex-none">
                        <Btn v-if="setInfo?.status === 'ONCHAIN_LOADED'" tooltip="This set is already on-chain" :disabled="true"><i class="fas fa-cloud-upload-alt"></i> Save on Chain</Btn>
                        <Btn v-if="setInfo?.status !== 'ONCHAIN_LOADED'" tooltip="Mint your set as an NFT on-chain" :disabled="!$store.state.builderData.currentSet.briqsDB.briqs.size" @click="mintSet"><i class="fas fa-cloud-upload-alt"></i> Save on Chain</Btn>
                    </div>
                </div>
            </div>
        </div>
        <div class="lg:w-[20rem] w-[11rem] flex-none md:block hidden"></div>
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
import { setModal, setModalAndAwait } from '../MiddleModal.vue';

import { setsManager } from '../../builder/SetsManager';
import ExportSetVue from './modals/ExportSet.vue';

import { defineComponent } from 'vue';
export default defineComponent({
    inject: ["messages"],
    computed: {
        setInfo() {
            return setsManager.getInfo(this.$store.state.builderData.currentSet.id);
        }  
    },
    methods: {
        async mintSet() {
            await setModalAndAwait(ExportSetVue, { set: this.$store.state.builderData.currentSet.id });
            setModal();
        },
        copyShareLink() {
            let network = this.$store.state.wallet.baseUrl.indexOf("mainnet") !== -1 ? "mainnet" : "testnet";
            navigator.clipboard.writeText(`${window.location.hostname}/share?set_id=${this.$store.state.builderData.currentSet.id}&network=${network}&version=1`);
            this.messages.pushMessage("Copied sharing link to clipboard");
        },
    }
})
</script>
