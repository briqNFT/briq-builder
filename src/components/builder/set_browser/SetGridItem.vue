<template>
    <div v-if="!isFiltered"
        :class="'w-full relative flex flex-col bg-darker rounded-md px-4 py-2 border-4' + (isCurrent ? ' border-deep-blue' : ' border-darker')"
         @click="$emit('selectSet', !selected)"
    >
        <div class="flex flex-nowrap items-center">
            <!--
                I want a "look centered, get pushed to the left by the icon if needed" look.
                To achieve that, I add a fake div to the left of the same size as the right one that compresses much faster.
             -->
            <div class="invisible min-w-0" style="flex: 0 5000 auto">
                <Tooltip :useCursor="true" v-if="setInfo.syncing" tooltip="...Syncing with StarkNet..."><i class="fas fa-spinner animate-spin-slow"></i></Tooltip>
                <Tooltip :useCursor="true" v-else-if="setInfo.isOnChain() && !setInfo.chain" tooltip="Error loading set metadata from chain"><i class="text-red-900 fas fa-times"></i></Tooltip>
                <Tooltip :useCursor="true" v-else-if="setInfo.status === 'ONCHAIN_ONLY'" tooltip="This set is saved on-chain"><i class="fas fa-cloud"></i></Tooltip>
                <Tooltip :useCursor="true" v-else-if="setInfo.status !== 'LOCAL'" tooltip="This set is saved on-chain but loaded in the builder"><i class="fas fa-cloud-download-alt"></i></Tooltip>
                <Tooltip :useCursor="true" v-if="setInfo.isEditing()" tooltip="This set is only available on this computer"><i class="fas fa-wrench"></i></Tooltip>
            </div>

            <h3 class="flex-auto text-center my-1 break-all">{{ setInfo.getSet()?.getName() || setInfo.id }}</h3>

            <div>
                <Tooltip :useCursor="true" v-if="setInfo.syncing" tooltip="...Syncing with StarkNet..."><i class="fas fa-spinner animate-spin-slow"></i></Tooltip>
                <Tooltip :useCursor="true" v-else-if="setInfo.isOnChain() && !setInfo.chain" tooltip="Error loading set metadata from chain"><i class="text-red-900 fas fa-times"></i></Tooltip>
                <Tooltip :useCursor="true" v-else-if="setInfo.status === 'ONCHAIN_ONLY'" tooltip="This set is saved on-chain"><i class="fas fa-cloud"></i></Tooltip>
                <Tooltip :useCursor="true" v-else-if="setInfo.status !== 'LOCAL'" tooltip="This set is saved on-chain but being edited in the builder"><i class="fas fa-cloud-download-alt"></i></Tooltip>
                <Tooltip :useCursor="true" v-if="setInfo.isEditing()" tooltip="This set is only available on this computer"><i class="fas fa-wrench"></i></Tooltip>
            </div>
        </div>
        <div class="flex-1 flex justify-center min-h-[2rem] my-2">
            <div v-if="imgSrc" class="flex flex-col justify-center"><img :src="imgSrc" class="rounded-md"/></div>
            <div v-if="!imgSrc" class="imagePlaceholder min-h-[8rem] rounded-md flex-1 text-center flex flex-col justify-center text-md font-semibold tracking-wider"><p>No Image</p></div>
        </div>
        <div class="relative">
            <div class="flex justify-between items-center">
                <i class="fas fa-ellipsis-h cursor-pointer" @click.stop="$emit('open', openDetails ? undefined : setId)"></i>
                <input type="checkbox" :checked="selected"/>
            </div>
            <div @click.stop="$emit('open', undefined)" v-if="openDetails"
                class="my-2 flex flex-col gap-2 shadow-xl text-sm absolute bottom-5 bg-base w-full rounded-md p-4 border-2 border-accent"
            >
                <template v-if="!setInfo.isLocalOnly()">
                    <Btn tooltip="Copy the sharing link for this set." class="bg-transparent" :disabled="!canShare" @click="copyShareLink"><i class="fas fa-share-square"></i> Copy Sharing Link</Btn>
                    <Btn tooltip="Transfer the set." class="bg-transparent" :disabled="disableButtons || !setInfo.chain" @click="transferSet"><i class="fas fa-dolly"></i> Transfer</Btn>
                    <Btn tooltip="Make a local copy of the set that you can then modify and re-export." class="bg-transparent" :disabled="disableButtons || !setInfo.chain" @click="duplicateSet(setInfo.chain!)"><i class="fas fa-copy"></i> Duplicate</Btn>
                    <Btn tooltip="Delete the set, the briqs can then be reused." class="bg-transparent" :disabled="disableButtons || !setInfo.chain" @click="disassemble"><i class="fas fa-magic"></i> Disassemble</Btn>
                    <Btn tooltip="Download the set data as JSON or 3D models" @click="openDownloadModal" :disabled="disableButtons || !setInfo.chain"><i class="fas fa-download"></i> Download</Btn>
                </template>
                <template v-else="">
                    <Btn tooltip="" class="bg-transparent" :disabled="!canMint" @click="mintSet"><i class="fas fa-cloud-upload-alt"></i> Mint on Chain</Btn>
                    <Btn tooltip="" class="bg-transparent" :disabled="disableButtons" @click="renameSet"><i class="fas fa-file-signature"></i> Rename</Btn>
                    <Btn tooltip="Duplicate the set." class="bg-transparent" :disabled="disableButtons" @click="duplicateSet(setInfo.local!)"><i class="fas fa-copy"></i> Duplicate</Btn>
                </template>
                <Btn v-if="setInfo.status === 'ONCHAIN_EDITING'" tooltip="Revert to onchain-set" class="bg-transparent" :disabled="disableButtons || !setInfo.chain" @click="deleteSet">Revert to on-chain version</Btn>

                <Btn v-if="setInfo.status === 'LOCAL'" tooltip="Delete this set." class="bg-transparent" :disabled="disableButtons" @click="deleteSet"><i class="fas fa-trash-alt"></i> Delete</Btn>
                <Btn tooltip="Load the set in the builder, to be edited." class="bg-transparent" :disabled="!canSelectSet" @click="selectSet"><i class="fas fa-folder-open"></i> Load in Builder</Btn>
            </div>
        </div>
    </div>
</template>

<style scoped>
.imagePlaceholder
{
    background: repeating-linear-gradient(
        -45deg,
        rgba(0, 0, 0, 0),
        rgba(0, 0, 0, 0), 10px,
        rgba(247, 137, 74, 0.5) 10px,
        rgba(247, 137, 74, 0.5) 15px
    );
}
</style>
<script lang="ts">

import TextModal from '../../generic/TextModal.vue';
import TransferSet from '../modals/TransferSet.vue';

import { Transaction, transactionsManager } from '../../../builder/Transactions';

import contractStore from '../../../Contracts';

import { SetData } from '../../../builder/setData';
import { setsManager, SetInfo } from '../../../builder/SetsManager';

import { reportError } from '../../../Monitoring';

import ExportSetVue from '../modals/ExportSet.vue';
import DownloadSetVue from '../modals/DownloadSet.vue';
import RenameSetVue from '../modals/RenameSet.vue';
import Tooltip from '../../generic/Tooltip.vue';

const DEFAULT_INFO = new SetInfo("");

import { reactive } from 'vue';
const setImageCache = reactive({} as { [set: string]: string });

import getBaseUrl, { fetchData } from '../../../url';
import { pushModal } from '../../Modals.vue';
import { getShareLink } from '../Sharing';

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
            setInfo: DEFAULT_INFO,
            disableButtons: false,
            imgSrc: undefined as string | undefined,
        };
    },
    emit: ["open"],
    inject: ["messages"],
    props: ["setId", "searchText", "openDetails", "selected"],
    async mounted() {
        this.setInfo = setsManager.getInfo(this.setId);
        if (!this.setInfo)
            throw new Error("Set does not exist in setsManager: " + this.setId);

        if (this.setInfo.isLocalOnly())
            return;
        // Load source image & cache it JS-side.
        this.imgSrc = setImageCache?.[this.setId];
        let src = new Image();
        src.src = getBaseUrl() + "/preview/" + this.setId;
        try {
            await src.decode();
            this.imgSrc = src.currentSrc;
            setImageCache[this.setId] = src.currentSrc;
        } catch (_) {
            this.imgSrc = undefined;
            delete setImageCache[this.setId];
        }
    },
    computed: {
        /** @return true if the item should be hidden */
        isFiltered: function () {
            // Hide sets that we know are being disassembled
            if (this.inDisassembly)
                return true;
            // Search
            if (!this.searchText.length)
                return false;
            let text = (this.searchText as string).toLowerCase();
            return this.setId.indexOf(text) === -1 && (this.setInfo.getSet()?.name?.toLowerCase()?.indexOf(text) ?? -1) === -1;
        },
        isCurrent() {
            return this.$store.state.builderData.currentSet.id === this.setId;
        },
        canShare() {
            return !this.disableButtons && this.setInfo.isOnChain();
        },
        canMint() {
            return this.setInfo.local?.getNbBriqs() > 0 && !this.disableButtons;
        },
        canSelectSet() {
            return !this.isCurrent;
        },
        importBtnText() {
            if (this.setInfo.status !== "ONCHAIN_ONLY")
                return "Already imported";
            return "Import";
        },
        inDisassembly() {
            return transactionsManager.get("disassembly").filter(x => x.isOk() && x?.metadata?.setId === this.setId).length;
        },
        inTransfer() {
            return transactionsManager.get("transfer_out").filter(x => x.isOk() && x?.metadata?.setId === this.setId).length;
        }
    },
    methods: {
        copyShareLink() {
            let network = this.$store.state.wallet.baseUrl.indexOf("mainnet") !== -1 ? "mainnet" : "testnet";
            let link = getShareLink(network, this.setInfo.id);
            navigator.clipboard.writeText(link);
            this.messages.pushMessage("Copied sharing link to clipboard");
        },
        async disassemble() {
            try {
                this.disableButtons = true;
                let TX = await contractStore.set.disassemble(this.$store.state.wallet.userWalletAddress, this.setInfo.id, this.setInfo.chain);
                new Transaction(TX.transaction_hash, "disassembly", { setId: this.setInfo.id });
                this.messages.pushMessage("Disassembly transaction sent - Hash " + TX.transaction_hash);
            }
            catch (err) {
                this.messages.pushMessage("Error while disassembling set - See console for details.");
                reportError(err, "Error while disassembling set");
            }
            this.disableButtons = false;
        },
        // TODO: use this?
        async loadSetFromChain() {
            try {
                this.disableButtons = true;
                await this.setInfo.loadLocally();
                this.messages.pushMessage("Set loaded");
            }
            catch (err) {
                this.messages.pushMessage("Error while loading set - See console for details.");
                console.error(err);
            }
            this.disableButtons = false;
        },
        async transferSet() {
            this.disableButtons = true;
            await pushModal(TransferSet, { setId: this.setId, data: this.setInfo.chain });
            this.disableButtons = false;
        },
        // Local options
        async selectSet() {
            if (!this.setInfo.local)
                await this.setInfo.loadLocally();
            await this.$store.dispatch("builderData/select_set", this.setId);
        },
        async openDownloadModal()
        {
            await pushModal(DownloadSetVue, { setId: this.setId, data: this.setInfo.chain });
        },
        async deleteSet() {
            // Ask for confirmation on non-empty sets.
            if (this.setInfo.status === "LOCAL" && (this.setInfo?.local?.getNbBriqs() ?? 0) > 0)
            {
                let btn = await pushModal(TextModal, {
                    "title": "Confirm delete?",
                    "text": "This set will be deleted. This cannot be undone. Are you sure?",
                    "buttons": [{ "text": "Yes" }, { "text": "No" }]
                });
                if (btn !== 0)
                    return;
            }
            setsManager.deleteLocalSet(this.setId);
        },
        duplicateSet(set: SetData) {
            setsManager.duplicateLocally(set);
        },
        async mintSet() {
            await pushModal(ExportSetVue, { set: this.setId });
        },
        async renameSet() {
            await pushModal(RenameSetVue, { set: this.setId });
        }
    },
    components: { Tooltip }
})
</script>