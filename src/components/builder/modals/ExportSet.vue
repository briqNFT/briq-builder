<template>
    <div class="md:w-4/5 lg:w-3/5 xl:w-1/2 w-auto">
        <div class="relative">
            <button @click="$emit('close')" class="absolute right-0">X</button>
            <h2 class="text-center w-full">Export set</h2>
            <template v-if="!exporting">
                <div class="flex justify-between flex-wrap gap-2">
                    <div class="flex-1">
                        <h4 class="font-medium">Set</h4>
                        <p>{{ metadata.set }}</p>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-medium">Name</h4>
                        <p>{{ set.name }} <button @click="rename">( click to rename )</button></p>
                    </div>
                </div>
                <template v-if="briqsForExport.length">
                    <h4 class="font-medium">Briqs</h4>
                    <div class="max-h-40 overflow-auto">
                        <BriqTable :briqs="briqsForExport" :columns="['color', 'material']">
                        </BriqTable>
                    </div>
                </template>
                <p v-if="transactionPending">Pending transaction: {{ pending_transaction.hash }}</p>
                <div class="flex justify-around my-8">
                    <div class="flex flex-col justify-start basis-1/2 text-center">
                        <p><button class="block mx-auto btn" @click="exportSetLocally">Export locally</button></p>
                        <p>Download a local copy of your set</p>
                    </div>
                    <div class="flex flex-col justify-start basis-1/2 text-center">
                        <p><button class="block mx-auto btn" :disabled="exporting || transactionPending || alreadyOnChain || !hasBriqsAndSets || notEnoughBriqs"
                            @click="exportSetOnChain">Export on chain</button></p>
                        <p v-if="alreadyOnChain">This set is already on chain. Copy it to export it anew.</p>
                        <p v-else-if="exporting || transactionPending">...Export is ongoing...</p>
                        <p v-else-if="notEnoughBriqs">You don't own enough briqs to export this set.</p>
                        <p v-else-if="!hasBriqsAndSets">Briqs need to be loaded before you can export a set. Please wait a little while.</p>
                        <p v-else="">Assemble briqs into a set on the blockchain</p>
                    </div>
                </div>
            </template>
            <template v-else>
                <div class="text-lg font-medium">
                    <p>1 - Signing: <i :class="getStepIcon('SIGNING')"></i></p>
                    <p>2 - Sending transaction: <i :class="getStepIcon('SENDING_TRANSACTION')"></i></p>
                    <p>3 - Waiting for transaction to be received: <i :class="getStepIcon('WAITING_FOR_CONFIRMATION')"></i></p>
                    <p class="mx-8">Hash: {{ pending_transaction?.hash ? '' : '(pending)' }}<span class="tracking-tighter text-sm font-light">{{ pending_transaction?.hash }}</span></p>
                    <p class="mx-8">Status: {{ pending_transaction?.status ?? '(pending)' }}</p>
                    <p>4 - All done</p>
                    <p><Btn class="float--right" @click="$emit('close')">Close</Btn></p>
                </div>
            </template>
        </div>
    </div>
</template>

<script lang="ts">
import { downloadData, downloadJSON, fetchData } from '../../../url'
import { SetData } from '../../../builder/SetData';
import type { Briq, BriqsDB } from '../../../builder/BriqsDB';

import { transactionsManager, Transaction } from '../../../builder/Transactions';

import contractStore from '../../../Contracts';

import { setsManager } from '../../../builder/SetsManager';
import BriqTable from '../BriqTable.vue';
import RenameSet from '../modals/RenameSet.vue';
import { awaitModal } from '../../MiddleModal.vue';
import { VERSION } from '../../../Meta';

import { takeScreenshot } from '../../../builder/graphics/builder.js';

type exportSteps = '' | 'SIGNING' | 'SENDING_TRANSACTION' | 'WAITING_FOR_CONFIRMATION' | 'DONE';

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
            name: "",
            pending_transaction: undefined as Transaction | undefined,
            exporting: '' as exportSteps,
            briqsForExport: [] as Array<Briq>,
            exportSet: undefined as SetData | undefined,
            screenshot: undefined as Promise<HTMLImageElement> | undefined,
        };
    },
    props: ["metadata"],
    emits: ["close"],
    inject: ["messages", "reportError"],
    async mounted() {
        this.name = this.set.name;
        this.pending_transaction = transactionsManager.get("export_set").filter(x => x.isOk() && x?.metadata?.setId === this.metadata.set)?.[0];
        await this.prepareForExport();
        let uri = takeScreenshot();
        let img = new Image();
        img.src = uri;
        this.screenshot = new Promise((resolve: (data: HTMLImageElement) => void) => {
            img.decode().then(() => resolve(img));
        })
    },
    computed: {
        setInfo() {
            return setsManager.setsInfo[this.metadata.set];
        },
        set() {
            return this.setInfo.local!;
        },
        alreadyOnChain() {
            return this.setInfo.status !== 'LOCAL' || this.pending_transaction?.isOnChain();
        },
        transactionPending() {
            return this.pending_transaction?.isPending() ?? false;
        },
        hasBriqsAndSets() {
            return this.$store.state.builderData.briqsDB.briqs.size;
        },
        notEnoughBriqs() {
            // if there is no exportable set, then we have some briq-related issue.
            return !this.exportSet;
        },
    },
    methods: {
        step(step: exportSteps)
        {
            return {
                '': 0,
                'SIGNING': 1,
                'SENDING_TRANSACTION': 2,
                'WAITING_FOR_CONFIRMATION': 3,
                'DONE': 4,
            }[step];
        },
        getStepIcon(step: exportSteps)
        {
            if (this.step(step) === this.step(this.exporting))
                return 'fas fa-spinner animate-spin-slow';
            else if (this.step(step) > this.step(this.exporting))
                return 'far fa-circle';
            else
                return 'fas fa-check';
        },
        async rename() {
            await awaitModal(RenameSet, { set: this.metadata.set });
        },
        exportSetLocally: function () {
            downloadJSON(this.set.serialize(), this.set.id + ".json");
        },
        exportSetOnChain: async function () {
            if (!contractStore.set)
                return;
            this.exporting = 'SIGNING';
            try {
                await this.prepareForExport();
                if (!this.exportSet)
                    throw new Error("The set could not be exported");
                // Update the name in case it changed.
                this.exportSet.name = this.set.name;
                let data = this.exportSet.serialize();

                const message = {
                    domain: {
                        name: "briq",
                        chainId: false ? 1 : 3,
                        version: VERSION,
                    },
                    types: {
                        StarkNetDomain: [
                            { name: "name", type: "felt" },
                            { name: "chainId", type: "felt" },
                            { name: "version", type: "felt" },
                        ],
                        Message: [{ name: "message", type: "felt" }],
                    },
                    primaryType: "Message",
                    message: {
                        "message": "mint_set"
                    },
                }

                let img = (await this.screenshot)!;
                let c = document.createElement("canvas");
                let ctx = c.getContext("2d")!;
                let ratio = Math.min(400 / img.width, 300 / img.height);
                c.width = Math.floor(img.width * ratio);
                c.height = Math.floor(img.height * ratio);
                ctx.scale(ratio, ratio);
                ctx.drawImage(img, 0, 0);
                let blob = fetch(c.toDataURL("image/jpeg", 0.95));

                // Debug
                downloadJSON(data, data.id + ".json")
                let signature = await this.$store.state.wallet.signer.signMessage(message);
                this.exporting = 'SENDING_TRANSACTION';
                let TX = await contractStore.set.mint(this.$store.state.wallet.userWalletAddress, data.id, data.briqs.map(x => x.data.briq));
                new Transaction(TX.transaction_hash, "export_set", { setId: data.id });
                this.pending_transaction = transactionsManager.getTx(TX.transaction_hash);

                this.exporting = 'WAITING_FOR_CONFIRMATION';
                // Poll the transaction status regularly.
                let regularly = setInterval(() => this.pending_transaction?.poll(), 3000);
                await fetchData("store_set", {
                    owner: this.$store.state.wallet.userWalletAddress,
                    token_id: data.id,
                    data: data,
                    transaction_hash: TX.transaction_hash,
                    message_hash: await this.$store.state.wallet.signer.hashMessage(message),
                    signature: signature,
                    image_base64: (await blob).url,
                });
                clearInterval(regularly);
                this.pending_transaction?.poll();
                this.messages.pushMessage("Set exported " + data.id + " - TX " + TX.transaction_hash);
                await this.$store.dispatch("builderData/update_set", data);

                setsManager.getInfo(data.id).status = 'ONCHAIN_LOADED';
                setsManager.getInfo(data.id).chain = this.exportSet;
                await this.$store.dispatch("builderData/select_set", data.id);
                this.exporting = 'DONE';
            }
            catch (err) {
                this.messages.pushMessage("Error while exporting set - check console for details");
                this.reportError(err);
                console.error(err);
                this.exporting = '';
            }
        },
        async prepareForExport() {
            if (this.exportSet)
                return;
            let data = this.set.serialize();
            const chainBriqs: BriqsDB = this.$store.state.builderData.briqsDB;
            let exportSet = new SetData(data.id);
            exportSet.deserialize(data);
            let userCustom = [];
            exportSet.forEach((briq: Briq) => {
                if (chainBriqs.briqs.has(briq.id))
                    userCustom.push(briq.id);
            });
            try {
                exportSet.swapForRealBriqs(chainBriqs);
            }
            catch (err) {
                this.briqsForExport = [];
                this.exportSet = undefined;
                return;
            }
            this.briqsForExport = Array.from(exportSet.briqsDB.briqs.values());
            this.exportSet = exportSet;
        }
    },
    components: { BriqTable }
})
</script>
