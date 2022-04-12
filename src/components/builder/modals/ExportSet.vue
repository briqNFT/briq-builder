<template>
    <Window class="md:!w-4/5 lg:!w-3/5 xl:!w-1/2 !w-auto min-h-[35rem]">
        <template #big-title>Export set</template>
        <h3 class="text-center">{{ set.id }}</h3>
        <div class="flex flex-nowrap items-center gap-3">
            <div class="w-full bg-accent rounded-md flex justify-around items-center p-2 my-4">
                <button class="flex flex-col justify-center items-center text-sm md:text-md" :disabled="step(exporting) > step('CONFIRMATION')" @click="exporting = 'METADATA'"><i :class="getStepIcon('METADATA')"></i>Details</button>
                <i class="text-sm fas fa-arrow-right"></i>
                <button class="flex flex-col justify-center items-center text-sm md:text-md" :disabled="step(exporting) > step('CONFIRMATION')" @click="exporting = 'PREVIEW'"><i :class="getStepIcon('PREVIEW')"></i>Preview</button>
                <i class="text-sm fas fa-arrow-right"></i>
                <button class="flex flex-col justify-center items-center text-sm md:text-md" :disabled="step(exporting) > step('CONFIRMATION')" @click="exporting = 'CONFIRMATION'"><i :class="getStepIcon('CONFIRMATION')"></i>Confirmation</button>
                <i class="text-sm fas fa-arrow-right"></i>
                <button class="flex flex-col justify-center items-center text-sm md:text-md" :disabled="true"><i :class="getStepIcon('TWEET')"></i> Export</button>
            </div>
        </div>
        <div class="overflow-hidden w-full">
            <div class="flex flex-nowrap relative" :style="{ left: `-${Math.min(step('SIGNING'), step(exporting))*100}%` }">
                <div class="flex-none w-full">
                    <h2 class="text-center">Error</h2>
                    <div class="text-lg font-semibold">
                        <p v-if="!hasAccount">You haven't connected your wallet!<br/>briq currently supports Argent-X on Starknet Testnet. Click on the 'Connect' button for instructions.</p>
                        <p v-else-if="alreadyOnChain">This set is already on chain. Copy it to export it anew.</p>
                        <p v-else-if="transactionPending">An export is already ongoing - see Transaction {{ pending_transaction?.hash }}</p>
                        <p v-else-if="needMinting">You have not yet minted any briqs!<br/>Click <button @click="openMintModal" class="underline">here</button> to claim your briqs.</p>
                        <p v-else-if="notEnoughBriqs">You don't own enough briqs to export this set.<br/>
                        You can disassemble a set to get briqs back and build again, <a href="https://briqnft.notion.site/Help-center-4a4958337970483dbfc2c1184290b42f#2d0d637eabcc4f83b4bed745962af3ef" target="blank_" class="underline font-normal">click here to learn more</a></p>
                    </div>
                </div>
                <div v-if="CONF.theme !== 'realms'" class="flex-none w-full">
                    <div class="my-2 flex flex-col gap-2">
                        <h3 class="font-medium">Set name <button @click="rename"><i class="far fa-edit"></i></button></h3>
                        <h2 class="break-all">{{ set.name }}</h2>
                        <div class="my-4"></div>
                        <h3 class="font-medium">Set description <button :disabled="true"><i class="far fa-edit"></i></button></h3>
                        <p class="text-lg">{{ "COMING SOON! Descriptions are not supported yet..." }}</p>
                    </div>
                </div>
                <div v-else="" class="flex-none w-full">
                    <div class="my-2 flex flex-col">
                        <h2 class="text-center">Select the wonder you built</h2>
                        <div class="grid grid-cols-4 gap-1">
                            <div v-for="data in realmsData" :key="data[0]"
                                @click="$store.dispatch('builderData/change_set_name', { set: set, name: data[1] })"
                                :class="'bg-darker rounded-md flex items-center flex-col p-2 select-none cursor-pointer hover:ring-2 ring-accent ' + (set.name === data[1] ? '!bg-accent' : '')">
                                <component :is="data[2]" class="w-6 h-6"/>
                                <h4 class="text-center text-xs">{{ data[0] }}</h4>
                                <h3 class="text-center text-md">{{ data[1] }}</h3>
                            </div>
                        </div>
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
                <div v-if="CONF.theme !== 'realms'" class="flex-none w-full">
                    <h3 class="text-center break-all">{{ set.name }}</h3>
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
                <div v-else="" class="flex-none w-full">
                    <p class="flex justify-center"><component class="w-8 h-8" :is="realmsData.find(x => x[1] === set.name)?.[2] || realmsData[0][2]"></component></p>
                    <h4 class="text-center">{{ realmsData.find(x => x[1] === set.name)?.[0] || realmsData[0][0] }}</h4>
                    <h3 class="text-center break-all">{{ set.name || set.id }}</h3>
                    <div class="flex justify-around items-center">
                        <p class="flex-initial"><img class="max-h-[25rem] m-auto rounded-xl" :src="screenshot"/></p>
                    </div>
                    <h4 class="text-center">{{ set.getNbBriqs() }} briqs</h4>
                    <div v-if="transactionPending || alreadyOnChain || !hasBriqsAndSets || notEnoughBriqs" class="flex justify-around my-2 text-center">
                        <p v-if="alreadyOnChain">This set is already on chain. Copy it to export it anew.</p>
                        <p v-else-if="transactionPending">...Export is ongoing...</p>
                        <p v-else-if="notEnoughBriqs">You don't own enough briqs to export this set.</p>
                        <div v-else-if="!hasBriqsAndSets">
                            <p>briqs need to be loaded before you can export a set.</p>
                            <p v-if="chainBriqs.fetchingBriqs">...Please wait while briqs are loading...</p>
                            <p v-else="">There was an error loading briqs. <button @click="chainBriqs.loadFromChain()">Click to retry</button></p>
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
                        <template v-if="CONF.theme === 'realms'">
                            <p :class="step(exporting) >= step('TWEET') ? '' : 'pointer-events-none'"><a  @click="exporting = 'DONE'" target="_blank" :href="`https://twitter.com/intent/tweet?text=${tweetContent}&url=${link}`">
                            4 - <Btn class="mx-2" :disabled="exporting !== 'TWEET' && exporting !== 'DONE'">Tweet about it</Btn></a><span class="text-md" v-if="exporting === 'TWEET'">(or <span class="font-semibold cursor-pointer" @click="exporting = 'DONE'">skip this step</span>)</span></p>
                        </template>
                        <p class="mt-8" v-if="exporting === 'DONE'">You’ve successfully signed your transaction! It is now pending on StarkNet.<br />You can now close this modal.</p>
                        <p class="mt-8" v-if="exporting === 'ERROR'">There was an error while exporting your set.<br/>The following step failed: {{ errorStep }}. Full error:<br/>
                            <span class="bg-accent p-1 text-sm font-light tracking-tight">{{ errorDetails.toString() }}</span>
                        </p>
                        <Btn class="my-2" v-if="exporting === 'ERROR'" @click="exporting = 'METADATA'; errorStep = undefined">Start over</Btn>
                    </div>
                </div>
            </div>
        </div>
        <div :class="'w-full bg-accent rounded-md flex justify-between items-center p-2 my-2' + (step(exporting) < step('SIGNING') ? '' : ' invisible')">
            <Btn :disabled="!canGoBack" @click="exporting = exportSteps[step(exporting) - 1]"><span class="mx-4">Back</span></Btn>
            <Btn :disabled="!canGoForward" v-if="step(exporting) < step('CONFIRMATION')" @click="exporting = exportSteps[step(exporting) + 1]"><span class="mx-4">Next</span></Btn>
            <Btn :disabled="transactionPending || alreadyOnChain || !hasBriqsAndSets || notEnoughBriqs" v-if="CONF.theme === 'realms' && step(exporting) === step('CONFIRMATION')" @click="exportSetOnChain"><span class="mx-4">Mint</span></Btn>
        </div>
    </Window>
</template>

<script lang="ts">
import getBaseUrl, { downloadData, downloadJSON, fetchData } from '../../../url'
import { SetData } from '../../../builder/SetData';

import { transactionsManager, Transaction } from '../../../builder/Transactions';

import contractStore from '@/chain/Contracts';
import { walletStore2 } from '@/chain/Wallet';
import { setsManager } from '../../../builder/SetsManager';
import BriqTable from '../BriqTable.vue';
import RenameSet from '../modals/RenameSet.vue';
import { pushModal } from '../../Modals.vue';
import { mintProxyStore } from '@/chain/MintProxy';

import { VERSION } from '../../../Meta';

import builderSettings from '../../../builder/graphics/Settings';

import { CONF } from '@/Conf';

import * as realms from '@/assets/realms/orders';

const realmsData = [
    ["The Order of Anger", "The Glowing Geyser", realms.Anger],
    ["The Order of Detection", "The Immortal Hot Spring", realms.Detection],
    ["The Order of Fury", "The Cerulean Chamber", realms.Fury],
    ["The Order of Rage", "The Ancestral Willow", realms.Rage],
    ["The Order of Reflection", "Pantheon Of Chaos", realms.Reflection],
    ["The Order of the Fox", "Altar Of The Void", realms.Fox],
    ["The Order of the Twins", "Sanctum Of The Oracle", realms.Twins],
    ["The Order of Vitriol", "The Perpetual Fjord", realms.Vitriol],
    ["The Order of Brilliance", "Infinity Spire", realms.Brilliance],
    ["The Order of Enlightenment", "The Ancestral Trees", realms.Enlightenment],
    ["The Order of Giants", "The Amaranthine Rock", realms.Giants],
    ["The Order of Perfection", "Sanctum Of Purpose", realms.Perfection],
    ["The Order of Power", "The Origin Oasis", realms.Power],
    ["The Order of Protection", "The Mirror Grotto", realms.Protection],
    ["The Order of Skill", "The Weeping Willow", realms.Skill],
    ["The Order of Titans", "The Solemn Catacombs", realms.Titans],
]

import { takeScreenshot } from '../../../builder/graphics/Builder';
import ScreenshotVue from './Screenshot.vue';
import CropScreenshotVue from './CropScreenshot.vue';
import MintModalVue from './MintModal.vue';

import { getShareLink } from '@/components/builder/Sharing';

type ExportSteps = 'PRECHECKS' | 'METADATA' | 'PREVIEW' | 'CONFIRMATION' | 'SIGNING' | 'SENDING_TRANSACTION' | 'WAITING_FOR_CONFIRMATION' | 'TWEET' | 'ERROR' | 'DONE';
const exportSteps = ['PRECHECKS', 'METADATA', 'PREVIEW', 'CONFIRMATION', 'SIGNING', 'SENDING_TRANSACTION', 'WAITING_FOR_CONFIRMATION', 'TWEET', 'ERROR', 'DONE'];

import { addBreadCrumb } from '@/Monitoring';

import { defineComponent } from 'vue';
import { logDebug } from '@/Messages';
export default defineComponent({
    data() {
        return {
            pending_transaction: undefined as Transaction | undefined,
            exporting: 'METADATA' as ExportSteps,
            exportSteps,
            errorStep: undefined as undefined | ExportSteps,
            errorDetails: "",
            screenshot: "" as string,
            screenshotPromise: undefined as Promise<string> | undefined,
            ogImage: "" as string,

            _exportSet: undefined as SetData | undefined,
        };
    },
    props: ["metadata"],
    emits: ["hide", "show"],
    inject: ["messages", "reportError", "chainBriqs"],
    async beforeMount() {
        // Hide until we've screenshotted, or the window 'pops'.
        this.$emit('hide');

        if (CONF.theme === 'realms' && !realmsData.find(x => x[1] === this.set.name))
            await this.$store.dispatch("builderData/change_set_name", { set: this.set, name: "" })

        this.pending_transaction = transactionsManager.get("export_set").filter(x => x.isOk() && x?.metadata?.setId === this.set.id)?.[0];
        if (!this.hasAccount || this.needMinting || this.notEnoughBriqs)
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
        CONF() {
            return CONF;
        },
        realmsData() {
            return realmsData;
        },
        tweetContent() {
            return encodeURIComponent(`I built the @lootrealms Wonder "${this.set.name}" with @briqNFT! We're trailblazing the way to #StarkNet layer 2 @starkwareLTD\n`);
        },
        link() {            
            return encodeURIComponent(getShareLink("testnet", this.set.id));
        },
        wallet() {
            return walletStore2;
        },
        setInfo() {
            return setsManager.getInfo(this.set.id);
        },
        set() {
            return this.metadata.set;
        },
        alreadyOnChain() {
            return (this.setInfo?.status && this.setInfo?.status !== 'LOCAL') || this.pending_transaction?.isOnChain();
        },
        transactionPending() {
            return this.pending_transaction?.isPending() ?? false;
        },
        hasAccount() {
            return !!this.wallet.signer;
        },
        needMinting() {
            return !mintProxyStore.hasMinted && (!this.hasBriqsAndSets || this.notEnoughBriqs);
        },
        hasBriqsAndSets() {
            return this.chainBriqs.status === 'OK';
        },
        notEnoughBriqs() {
            // if there is no exportable set, then we have some briq-related issue.
            return this.hasBriqsAndSets && !this.exportSet;
        },
        canGoBack() {
            return this.step(this.exporting) <= this.step('CONFIRMATION') && this.step(this.exporting) > this.step('METADATA');
        },
        canGoForward() {
            return this.set.name && this.step(this.exporting) != this.step('PRECHECKS');
        },
        exportSet() {
            if (this._exportSet)
                return this._exportSet;
            let data = this.set.serialize();
            let exportSet = new SetData(data.id);
            exportSet.deserialize(data);
            try {
                exportSet.swapForRealBriqs(this.chainBriqs);
            }
            catch (err) {
                return;
            }
            this._exportSet = exportSet;
            return this._exportSet;
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
                return 'fas fa-circle';
            else if (this.step(step) > this.step(this.exporting))
                return 'far fa-circle';
            else
                return 'fas fa-check';
        },
        async openMintModal() {
            await pushModal(MintModalVue);
        },
        async retakeScreenshot() {
            let img = new Image();
            let url = await pushModal(ScreenshotVue, { background: false }) as string;
            // Nothing to do if we cancelled.
            if (!url)
                return;
            img.src = url;
            await img.decode();
            this.ogImage = img.src;
            this.screenshotPromise = this.prepareImage(img);
            this.screenshot = await this.screenshotPromise;
        },
        async cropScreenshot() {
            let img = new Image();
            let url = await pushModal(CropScreenshotVue, { screenshot: this.ogImage }) as string;;
            // Nothing to do if we cancelled.
            if (!url)
                return;
            img.src = url
            await img.decode();
            this.screenshotPromise = this.prepareImage(img);
            this.screenshot = await this.screenshotPromise;
        },
        async rename() {
            await pushModal(RenameSet, { set: this.set.id });
        },
        exportSetLocally: function () {
            downloadJSON(this.set.serialize(), this.set.id + ".json");
        },
        exportSetOnChain: async function () {
            if (!contractStore.set)
                return;
            try {
                if (!this.exportSet)
                    throw new Error("The set could not be exported");
                // Update the name in case it changed.
                this.exportSet.name = this.set.name;

                if (this.set.name.length > 200)
                    throw new Error("Set name too long, max length is 200 characters.");

                let token_hint = this.set.id;
                this.exportSet.id = contractStore.set.precomputeTokenId(this.wallet.userWalletAddress, token_hint);

                let data = this.exportSet.serialize();

                data.recommendedSettings = builderSettings.getSettingsForSetExport();

                this.exporting = 'SIGNING';

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

                let signature = await this.wallet.signer.signMessage(message);
                this.exporting = 'SENDING_TRANSACTION';

                await fetchData("store_set", {
                    owner: this.wallet.userWalletAddress,
                    token_id: data.id,
                    data: data,
                    message_hash: await this.wallet.signer.hashMessage(message),
                    signature: signature,
                    image_base64: (await this.screenshotPromise),
                });

                // Debug
                //downloadJSON(data, data.id + ".json")
                let TX = await contractStore.set.assemble(this.wallet.userWalletAddress,
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
                logDebug("Set exported " + data.id);

                let info = setsManager.onSetMinted(this.set.id, this.exportSet)
                info.chain_owner = this.wallet.userWalletAddress;
                this.$store.dispatch("builderData/select_set", this.exportSet.id);

                if (CONF.theme === 'realms')
                    this.exporting = 'TWEET';
                else
                    this.exporting = 'DONE';
            }
            catch (err) {
                if (err?.message === "User abort") {
                    this.messages.pushMessage("Export aborted.");
                    this.errorDetails = "Aborted by user";
                } else if (err === "Timeout") {
                    this.messages.pushMessage("Error while exporting set - wallet timeout.");
                    this.errorDetails = "Wallet timeout";
                } else {
                    this.messages.pushMessage("Error while exporting set - check browser console for details");
                    this.errorDetails = err;
                    console.error(err);
                    this.reportError(err);
                }
                this.errorStep = this.exporting;
                this.exporting = 'ERROR';
            }
        },
    },
    components: { BriqTable, RenameSet }
})
</script>
