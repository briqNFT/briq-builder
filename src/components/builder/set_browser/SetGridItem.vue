<template>
    <div v-if="!isFiltered" :class="'w-full bg-briq-dark rounded-md px-4 py-2 border-4' + (isCurrent ? ' border-deep-blue' : ' border-briq-dark')">
        <h3 class="text-center my-1">{{ setInfo.getSet()?.getName() }}
            <i v-if="false" class="fas fa-spinner animate-spin-slow"></i>
            <i v-else-if="setInfo.status === 'ONCHAIN_ONLY'" class="fas fa-cloud"></i>
            <i v-else-if="setInfo.status !== 'LOCAL'" class="fas fa-cloud-download-alt"></i>
            <i v-if="setInfo.isEditing()" class="fas fa-wrench"></i>
            <!--<i v-else-if="setInfo.status === 'LOCAL'" class="fas fa-check-circle"></i>-->
        </h3>
        <div class="my-2 flex flex-col gap-2 text-sm">
            <template v-if="setInfo.isOnChain()">
                <Button tooltip="Copy the sharing link for this set." class="bg-transparent" :disabled="!canShare" @click="copyShareLink"><i class="fas fa-share-square"></i> Copy Sharing Link</Button>
                <Button tooltip="Delete the set, the briqs can then be reused." class="bg-transparent" :disabled="disableButtons || !setInfo" @click="disassemble"><i class="fas fa-magic"></i> Disassemble</Button>
                <Button tooltip="Transfer the set." class="bg-transparent" :disabled="disableButtons || !setInfo" @click="transferSet"><i class="fas fa-dolly"></i> Transfer</Button>

                <Button tooltip="Make a local copy of the set that you can then modify and re-export." class="bg-transparent" :disabled="disableButtons || !setInfo.chain" @click="duplicateSet(setInfo.chain!)"><i class="fas fa-copy"></i> Make a local copy</Button>

                <Button v-if="setInfo.status === 'ONCHAIN_ONLY'" tooltip="Download a view-only local copy." class="bg-transparent" :disabled="disableButtons || !setInfo.chain" @click="loadSetFromChain"><i class="fas fa-cloud-download-alt"></i> Cache locally</Button>
            </template>
            <template v-else="">
                <Button tooltip="" class="bg-transparent" :disabled="disableButtons" @click="duplicateSet(setInfo.local!)"><i class="fas fa-copy"></i> Duplicate</Button>
                <Button tooltip="" class="bg-transparent" :disabled="!canMint" @click="mintSet"><i class="fas fa-cloud-upload-alt"></i> Save on Chain</Button>
                <Button tooltip="" class="bg-transparent" :disabled="disableButtons" @click="renameSet"><i class="fas fa-file-signature"></i> Rename</Button>
            </template>
            <template v-if="setInfo.status !== 'ONCHAIN_ONLY'">
                <Button v-if="setInfo.status !== 'LOCAL'" tooltip="Delete the local copy of this set. The on-chain version will remain." class="bg-transparent" :disabled="disableButtons" @click="deleteSet"><i class="fas fa-trash"></i> Clear Cached Copy</Button>
                <Button v-if="setInfo.status === 'LOCAL'" tooltip="Delete this set." class="bg-transparent" :disabled="disableButtons" @click="deleteSet"><i class="fas fa-trash-alt"></i> Delete</Button>
                <Button tooltip="" class="bg-transparent" :disabled="!canSelectSet" @click="selectSet"><i class="fas fa-folder-open"></i> Load in Builder</Button>
            </template>
        </div>
    </div>
</template>

<script lang="ts">
import { setModal, setModalAndAwait } from '../../MiddleModal.vue'

import TextModal from '../../generic/TextModal.vue';
import TransferSet from '../modals/TransferSet.vue';

import { Transaction, transactionsManager } from '../../../builder/Transactions';

import contractStore from '../../../Contracts';

import { SetData } from '../../../builder/setData';
import { setsManager, SetInfo } from '../../../builder/SetsManager';

const DEFAULT_INFO = new SetInfo("");

import ExportSetVue from '../modals/ExportSet.vue';
import { reportError } from '../../../Monitoring';

import { defineComponent } from "@vue/runtime-core"
import RenameSetVue from '../modals/RenameSet.vue';
export default defineComponent({
    data() {
        return {
            setInfo: DEFAULT_INFO,
            disableButtons: false
        }
    },
    inject: ["messages"],
    props: ["setId", "searchText"],
    mounted() {
        this.setInfo = setsManager.getInfo(this.setId);
        if (!this.setInfo)
            throw new Error("Set does not exist in setsManager: " + this.setId);
    },
    computed: {
        /** @return true if the item should be hidden */
        isFiltered: function() {
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
            return this.setInfo.local?.briqsDB?.briqs?.size > 0 && !this.disableButtons;
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
            navigator.clipboard.writeText(`${window.location.hostname}/share?set_id=${this.setId}&network=${network}&version=1`);
            this.messages.pushMessage("Copied sharing link to clipboard");
        },
        async disassemble() {
            try {
                this.disableButtons = true;
                let TX = await contractStore.set.disassemble(this.$store.state.wallet.userWalletAddress, "" + this.setInfo.id, Array.from(this.setInfo.chain.briqsDB.briqs.keys()));
                new Transaction(TX.transaction_hash, 'disassembly', { setId: this.setInfo.id });
                this.messages.pushMessage("Disassembly transaction sent - Hash " + TX.transaction_hash);   
            }
            catch(err)
            {
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
            catch(err)
            {
                this.messages.pushMessage("Error while loading set - See console for details.");   
                console.error(err);
            }
            this.disableButtons = false;
        },
        async transferSet() {
            this.disableButtons = true;
            await setModalAndAwait(TransferSet, { setId: this.setId, data: this.setInfo.chain });
            setModal();
            this.disableButtons = false;
        },

        // Local options
        async selectSet() {
            await this.$store.dispatch('builderData/select_set', this.setId)
        },
        async deleteSet() {
            let current = this.isCurrent;
            // Ask for confirmation on non-empty sets.
            if (this.setInfo.status === 'LOCAL' && this.setInfo?.local?.briqsDB?.briqs?.size > 0)
            {
                let btn = await setModalAndAwait(TextModal, {
                    "title": "Confirm delete?",
                    "text": "This set will be deleted. This cannot be undone. Are you sure?",
                    "buttons": [{ "text": "Yes" }, { "text": "No" }]
                });
                setModal();
                if (btn !== 0)
                    return;
            }
            setsManager.deleteLocalSet(this.setId);
            if (current)
            {
                // Must have a local set.
                let set = setsManager.getLocalSet();
                if (!set)
                    set = setsManager.createLocalSet();
                console.log("set is ", set);
                this.$store.dispatch("builderData/select_set", set.id);
            }
        },
        duplicateSet(set: SetData) {
            setsManager.duplicateLocally(set);
        },
        async mintSet() {
            await setModalAndAwait(ExportSetVue, { set: this.setId });
            setModal();
        },
        async renameSet() {
            await setModalAndAwait(RenameSetVue, { set: this.setId });
            setModal();
        }
    }
})
</script>