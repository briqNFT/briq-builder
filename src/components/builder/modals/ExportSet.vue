<template>
    <div class="md:w-4/5 lg:w-3/5 xl:w-1/2 w-auto min-h-[35rem]">
        <div class="relative">
            <button @click="$emit('close')" class="absolute right-0">X</button>
            <h2 class="text-center w-full">Export set</h2>
            <h3 class="text-center">{{ metadata.set }}</h3>
            <div class="flex flex-nowrap items-center gap-3">
                <div class="w-full bg-accent rounded-md flex justify-around items-center p-2 my-4">
                    <button class="flex flex-col justify-center items-center text-sm md:text-md" :disabled="step(exporting) > step('CONFIRMATION')" @click="exporting = 'METADATA'"><i :class="getStepIcon('METADATA')"></i>Details</button>
                    <i class="text-sm fas fa-arrow-right"></i>
                    <button class="flex flex-col justify-center items-center text-sm md:text-md" :disabled="step(exporting) > step('CONFIRMATION')" @click="exporting = 'PREVIEW'"><i :class="getStepIcon('PREVIEW')"></i>Preview</button>
                    <i class="text-sm fas fa-arrow-right"></i>
                    <button class="flex flex-col justify-center items-center text-sm md:text-md" :disabled="step(exporting) > step('CONFIRMATION')" @click="exporting = 'CONFIRMATION'"><i :class="getStepIcon('CONFIRMATION')"></i>Confirmation</button>
                    <i class="text-sm fas fa-arrow-right"></i>
                    <button class="flex flex-col justify-center items-center text-sm md:text-md" :disabled="true"><i :class="getStepIcon('DONE')"></i> Export</button>
                </div>
            </div>
            <div class="overflow-hidden w-full">
                <div class="flex flex-nowrap relative" :style="{ left: `-${Math.min(step('SIGNING'), step(exporting))*100}%` }">
                    <div class="flex-none w-full">
                        <h2 class="text-center">Error</h2>
                        <div class="text-lg font-semibold">
                            <p v-if="alreadyOnChain">This set is already on chain. Copy it to export it anew.</p>
                            <p v-else-if="transactionPending">An export is already ongoign - see Transaction {{ pending_transaction?.hash }}</p>
                            <p v-else-if="notEnoughBriqs">You don't own enough briqs to export this set.</p>
                        </div>
                    </div>
                    <div class="flex-none w-full">
                        <div class="my-2 flex flex-col gap-2">
                            <h3 class="font-medium">Set name <button @click="rename"><i class="far fa-edit"></i></button></h3>
                            <h2>{{ set.name }}</h2>
                            <div class="my-4"></div>
                            <h3 class="font-medium">Set description <button :disabled="true"><i class="far fa-edit"></i></button></h3>
                            <p class="text-lg">{{ "COMING SOON! Descriptions are not supported yet..." }}</p>
                        </div>
                    </div>
                    <div class="flex-none w-full">
                        <div class="flex flex-col justify-evenly h-full">
                            <img class="m-auto my-0 max-h-[25rem] rounded-xl" :src="screenshot"/>
                            <div class="flex justify-evenly">
                                <Btn @click="cropScreenshot">Crop Image</Btn>
                                <Btn @click="retakeScreenshot">Retake Screenshot</Btn>
                            </div>
                        </div>
                    </div>
                    <div class="flex-none w-full">
                        <h3 class="text-center">{{ set.name }}</h3>
                        <h4 class="text-center">{{ set.getNbBriqs() }} briqs</h4>
                        <div class="flex justify-around items-center">
                            <p class="flex-initial"><img class="max-h-[20rem] m-auto rounded-xl" :src="screenshot"/></p>
                        </div>
                        <div class="flex justify-around my-8">
                            <div class="flex flex-col justify-start basis-1/2 text-center">
                                <p><button class="block mx-auto btn" @click="exportSetLocally">Export locally</button></p>
                                <p>Download a local copy of your set</p>
                            </div>
                            <div class="flex flex-col justify-start basis-1/2 text-center">
                                <p><button class="block mx-auto btn" :disabled="transactionPending || alreadyOnChain || !hasBriqsAndSets || notEnoughBriqs"
                                    @click="exportSetOnChain">Mint on chain</button></p>
                                <p v-if="alreadyOnChain">This set is already on chain. Copy it to export it anew.</p>
                                <p v-else-if="transactionPending">...Export is ongoing...</p>
                                <p v-else-if="notEnoughBriqs">You don't own enough briqs to export this set.</p>
                                <div v-else-if="!hasBriqsAndSets">
                                    <p>briqs need to be loaded before you can export a set.</p>
                                    <p v-if="chainBriqs.fetchingBriqs">...Please wait while briqs are loading...</p>
                                    <p v-else="">There was an error loading briqs. <button @click="chainBriqs.loadFromChain()">Click to retry</button></p>
                                </div>
                                <p v-else="">Assemble briqs into a set on the blockchain</p>
                            </div>
                        </div>
                    </div>
                    <div :class="'flex-none w-full'">
                        <div class="text-lg font-medium">
                            <p>1 - Signing: <i :class="getStepIcon('SIGNING')"></i></p>
                            <p>2 - Sending transaction: <i :class="getStepIcon('SENDING_TRANSACTION')"></i></p>
                            <p>3 - Waiting for transaction to be received: <i :class="getStepIcon('WAITING_FOR_CONFIRMATION')"></i></p>
                            <p class="mx-8">Hash: {{ pending_transaction?.hash ? '' : '(pending)' }}<span class="tracking-tighter text-sm font-light">{{ pending_transaction?.hash }}</span></p>
                            <p class="mx-8">Status: {{ pending_transaction?.status ?? '(pending)' }}</p>
                            <div class="my-8"></div>
                            <p v-if="exporting === 'DONE'">You’ve successfully signed your transaction! It is now pending on StarkNet.<br />You can now close this modal.</p>
                            <p v-if="exporting === 'ERROR'">There was an error while exporting your set.<br/>The following step failed: {{ errorStep }}. Full error:<br/>
                                <span class="bg-accent p-1 text-sm font-light tracking-tight">{{ errorDetails.toString() }}</span>
                            </p>
                            <Btn class="my-2" v-if="exporting === 'ERROR'" @click="exporting = 'METADATA'; errorStep = undefined">Start over</Btn>
                        </div>
                    </div>
                </div>
            </div>
            <div :class="'w-full bg-accent rounded-md flex justify-between items-center p-2 my-2' + (step(exporting) < step('SIGNING') ? '' : ' invisible')">
                <Btn :disabled="step(exporting) > step('CONFIRMATION') || step(exporting) <= step('METADATA')" @click="exporting = exportSteps[step(exporting) - 1]"><span class="mx-4">Back</span></Btn>
                <Btn v-if="step(exporting) < step('CONFIRMATION')" @click="exporting = exportSteps[step(exporting) + 1]"><span class="mx-4">Next</span></Btn>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import getBaseUrl, { downloadData, downloadJSON, fetchData } from '../../../url'
import { SetData } from '../../../builder/SetData';

import { transactionsManager, Transaction } from '../../../builder/Transactions';

import contractStore from '../../../Contracts';

import { setsManager } from '../../../builder/SetsManager';
import BriqTable from '../BriqTable.vue';
import RenameSet from '../modals/RenameSet.vue';
import { pushModal } from '../../Modals.vue';

import { VERSION } from '../../../Meta';

import { takeScreenshot } from '../../../builder/graphics/Builder';
import ScreenshotVue from './Screenshot.vue';
import CropScreenshotVue from './CropScreenshot.vue';

type ExportSteps = 'PRECHECKS' | 'METADATA' | 'PREVIEW' | 'CONFIRMATION' | 'SIGNING' | 'SENDING_TRANSACTION' | 'WAITING_FOR_CONFIRMATION' | 'ERROR' | 'DONE';
const exportSteps = ['PRECHECKS', 'METADATA', 'PREVIEW', 'CONFIRMATION', 'SIGNING', 'SENDING_TRANSACTION', 'WAITING_FOR_CONFIRMATION', 'ERROR', 'DONE'];

async function sleep() { await new Promise(res => setTimeout(res, 5000)) }

import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
            name: "",
            pending_transaction: undefined as Transaction | undefined,
            exporting: 'METADATA' as ExportSteps,
            exportSteps,
            errorStep: undefined as undefined | ExportSteps,
            errorDetails: "",
            screenshot: "" as string,
            screenshotPromise: undefined as Promise<string> | undefined,
            ogImage: "" as string,
            setId: "" as string,
        };
    },
    props: ["metadata"],
    emits: ["close", "hide", "show"],
    inject: ["messages", "reportError", "chainBriqs"],
    async beforeMount() {
        // Hide until we've screenshotted, or the window 'pops'.
        this.$emit('hide');

        this.setId = this.metadata.set;

        this.name = this.set.name;
        this.pending_transaction = transactionsManager.get("export_set").filter(x => x.isOk() && x?.metadata?.setId === this.setId)?.[0];
        if (this.notEnoughBriqs)
            this.exporting = 'PRECHECKS';
        let img = new Image();
        if (this.metadata.screenshot)
            img.src = this.metadata.screenshot;
        else
            img.src = takeScreenshot();
        img.decode().then(async () => {
            //await sleep();
            this.ogImage = img.src;
            this.screenshotPromise = this.prepareImage(img);
            this.screenshot = await this.screenshotPromise;
            this.$emit('show');
        });
    },
    computed: {
        setInfo() {
            return setsManager.setsInfo[this.setId];
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
            // Assume having 0 briqs is an error.
            return this.chainBriqs.getNbBriqs();
        },
        notEnoughBriqs() {
            // if there is no exportable set, then we have some briq-related issue.
            return this.hasBriqsAndSets && !this.exportSet;
        },
        exportSet() {
            let data = this.set.serialize();
            let exportSet = new SetData(data.id);
            exportSet.deserialize(data);
            try {
                exportSet.swapForRealBriqs(this.chainBriqs);
            }
            catch (err) {
                return undefined;
            }
            return exportSet;
        },
    },
    methods: {
        async prepareImage(img: HTMLImageElement): Promise<string>
        {
            let c = document.createElement("canvas");
            let ctx = c.getContext("2d")!;
            let ratio = Math.min(1, Math.min(800 / img.width, 600 / img.height));

            c.width = Math.floor(img.width * ratio);
            c.height = Math.floor(img.height * ratio);

            // Prevent images from being too tall by adding transparent sides.
            let whRatio = img.width / img.height;
            let imgBlitStart = 0;
            if (whRatio < 0.75)
            {
                imgBlitStart = (c.height * 0.75 - c.width) / 2.0 / ratio;
                c.width = c.height * 0.75;
            }

            ctx.scale(ratio, ratio);
            ctx.drawImage(img, imgBlitStart, 0);
            return (await fetch(c.toDataURL("image/png"))).url;
        },
        step(step: ExportSteps)
        {
            return exportSteps.indexOf(step);
        },
        getStepIcon(step: ExportSteps)
        {
            if (this.errorStep)
            {
                if (step === this.errorStep)
                    return 'fas fa-times';
                if (this.step(this.errorStep) < this.step(step))
                    return 'far fa-circle';
                return 'fas fa-check';
            }
            if (this.step(step) === this.step(this.exporting))
                return 'fas fa-spinner animate-spin-slow';
            else if (this.step(step) > this.step(this.exporting))
                return 'far fa-circle';
            else
                return 'fas fa-check';
        },
        async retakeScreenshot() {
            let img = new Image();
            //this.$emit('hide');
            img.src = await pushModal(ScreenshotVue, { set: this.setId }) as string;
            //this.$emit('show');
            await img.decode();
            this.ogImage = img.src;
            this.screenshotPromise = this.prepareImage(img);
            this.screenshot = await this.screenshotPromise;
        },
        async cropScreenshot() {
            let img = new Image();
            img.src = await pushModal(CropScreenshotVue, { screenshot: this.ogImage }) as string;
            await img.decode();
            this.screenshotPromise = this.prepareImage(img);
            this.screenshot = await this.screenshotPromise;
        },
        async rename() {
            await pushModal(RenameSet, { set: this.setId });
        },
        exportSetLocally: function () {
            downloadJSON(this.set.serialize(), this.set.id + ".json");
        },
        exportSetOnChain: async function () {
            if (!contractStore.set)
                return;
            this.exporting = 'SIGNING';
            try {
                if (!this.exportSet)
                    throw new Error("The set could not be exported");
                // Update the name in case it changed.
                this.exportSet.name = this.set.name;
                let token_hint = this.exportSet.id;
                this.exportSet.id = contractStore.set.precomputeTokenId(this.$store.state.wallet.userWalletAddress, token_hint);

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

                let signature = await this.$store.state.wallet.signer.signMessage(message);
                this.exporting = 'SENDING_TRANSACTION';

                await fetchData("store_set", {
                    owner: this.$store.state.wallet.userWalletAddress,
                    token_id: data.id,
                    data: data,
                    message_hash: await this.$store.state.wallet.signer.hashMessage(message),
                    signature: signature,
                    image_base64: (await this.screenshotPromise),
                });

                // Debug
                //downloadJSON(data, data.id + ".json")
                let TX = await contractStore.set.assemble(this.$store.state.wallet.userWalletAddress,
                    token_hint,
                    data.briqs.map((x: any) => x.data),
                    getBaseUrl() + "/store_get/" + data.id
                );
                
                // Mark the transaction as waiting.
                new Transaction(TX.transaction_hash, "export_set", { setId: data.id });
                
                this.pending_transaction = transactionsManager.getTx(TX.transaction_hash);

                this.exporting = 'WAITING_FOR_CONFIRMATION';
                await new Promise(resolve => {
                    // Poll the transaction status regularly.
                    let regularly: any;
                    regularly = setInterval(async () => {
                        await this.pending_transaction!.poll();
                        if (this.pending_transaction!.isPending() || !this.pending_transaction!.isOk())
                        {
                            clearInterval(regularly);
                            resolve(null);
                        }
                    }, 3000);
                });
                this.messages.pushMessage("Set exported " + data.id + " - TX " + TX.transaction_hash);

                setsManager.onSetMinted(this.set.id, this.exportSet)
                this.setId = this.exportSet.id;
                this.$store.dispatch("builderData/select_set", this.exportSet.id);

                this.exporting = 'DONE';
            }
            catch (err) {
                this.messages.pushMessage("Error while exporting set - check browser console for details");
                this.reportError(err);
                console.error(err);
                this.errorDetails = err;
                this.errorStep = this.exporting;
                this.exporting = 'ERROR';
            }
        },
    },
    components: { BriqTable, RenameSet }
})
</script>
