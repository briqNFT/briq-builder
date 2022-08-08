<template>
    <div
        class="md:!w-4/5 lg:!w-3/5 xl:!w-1/2 !w-auto min-h-[35rem] flex h-screen overflow-auto fixed top-0 justify-center items-center">
        <div class="relative">
            <button @click="$emit('close')" class="absolute right-0">X</button>
            <h2 class="text-center w-full">Migrate set</h2>
            <h3 class="text-center">{{ metadata.set }}</h3>
            <div class="overflow-hidden w-full">
                <div
                    class="flex flex-nowrap relative"
                    :style="{ left: `-${Math.min(step('SIGNING'), step(exporting)) * 100}%` }">
                    <div class="flex-none w-full">
                        <h2 class="text-center">Error</h2>
                        <div class="text-lg font-semibold">
                            <p v-if="transactionPending">
                                An export is already ongoing - see Transaction {{ pending_transaction?.hash }}
                            </p>
                            <p v-else-if="notEnoughBriqs">You don't own enough briqs to export this set.</p>
                        </div>
                    </div>
                    <div class="flex-none w-full">
                        <h3 class="text-center">{{ set.name }}</h3>
                        <h4 class="text-center">{{ set.getNbBriqs() }} briqs</h4>
                        <div class="flex justify-around items-center">
                            <p class="flex-initial">
                                <img class="max-h-[20rem] m-auto rounded-md" :src="metadata?.img?.currentSrc">
                            </p>
                        </div>
                        <div class="flex justify-around my-8">
                            <div class="flex flex-col justify-start basis-1/2 text-center">
                                <p>
                                    <button class="block mx-auto btn" @click="exportSetLocally">Export locally</button>
                                </p>
                                <p>Download a local copy of your set</p>
                            </div>
                            <div class="flex flex-col justify-start basis-1/2 text-center">
                                <p>
                                    <button
                                        class="block mx-auto btn"
                                        :disabled="transactionPending || !hasBriqsAndSets || notEnoughBriqs"
                                        @click="exportSetOnChain">
                                        Migrate on chain
                                    </button>
                                </p>
                                <p v-if="transactionPending">...Export is ongoing...</p>
                                <p v-else-if="notEnoughBriqs">You don't own enough briqs to export this set.</p>
                                <div v-else-if="!hasBriqsAndSets">
                                    <p>briqs need to be loaded before you can export a set.</p>
                                    <p v-if="chainBriqs.fetchingBriqs">...Please wait while briqs are loading...</p>
                                    <p v-else="">
                                        There was an error loading briqs.
                                        <button @click="chainBriqs.loadFromChain()">Click to retry</button>
                                    </p>
                                </div>
                                <p v-else="">Migrate your set to the new contract</p>
                            </div>
                        </div>
                    </div>
                    <div :class="'flex-none w-full'">
                        <div class="text-lg font-medium">
                            <p>1 - Signing: <i :class="getStepIcon('SIGNING')"/></p>
                            <p>2 - Sending transaction: <i :class="getStepIcon('SENDING_TRANSACTION')"/></p>
                            <p>
                                3 - Waiting for transaction to be received:
                                <i :class="getStepIcon('WAITING_FOR_CONFIRMATION')"/>
                            </p>
                            <p class="mx-8">
                                Hash: {{ pending_transaction?.hash ? '' : '(pending)'
                                }}<span class="tracking-tighter text-sm font-light">{{
                                    pending_transaction?.hash
                                }}</span>
                            </p>
                            <p class="mx-8">Status: {{ pending_transaction?.status ?? '(pending)' }}</p>
                            <p>4 - Disassembling older set: <i :class="getStepIcon('DISASSEMBLING')"/></p>
                            <div class="my-8"/>
                            <p v-if="exporting === 'DONE'">
                                You’ve successfully signed your transaction! It is now pending on StarkNet.<br>You can
                                now close this modal.
                            </p>
                            <p v-if="exporting === 'ERROR'">
                                There was an error while exporting your set.<br>The following step failed:
                                {{ errorStep }}. Full error:<br>
                                <span class="bg-primary p-1 text-sm font-light tracking-tight">{{
                                    errorDetails.toString()
                                }}</span>
                            </p>
                            <Btn
                                class="my-2"
                                v-if="exporting === 'ERROR'"
                                @click="
                                    exporting = 'CONFIRMATION';
                                    errorStep = undefined;
                                ">
                                Start over
                            </Btn>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { downloadJSON } from '../../../url';
import { SetData } from '../../../builder/SetData';

import { transactionsManager, Transaction } from '../../../builder/Transactions';

import contractStore from '@/chain/Contracts';
import { walletStore } from '@/chain/Wallet';

import { setsManager } from '../../../builder/SetsManager';
import BriqTable from '../BriqTable.vue';
import RenameSet from '../modals/RenameSet.vue';

import { legacySetsMgr } from '../set_browser/LegacySetsMgr';
import { backendManager } from '@/Backend';

import { VERSION } from '../../../Meta';

type ExportSteps =
    | 'PRECHECKS'
    | 'CONFIRMATION'
    | 'SIGNING'
    | 'SENDING_TRANSACTION'
    | 'WAITING_FOR_CONFIRMATION'
    | 'DISASSEMBLING'
    | 'ERROR'
    | 'DONE';
const exportSteps = [
    'PRECHECKS',
    'CONFIRMATION',
    'SIGNING',
    'SENDING_TRANSACTION',
    'WAITING_FOR_CONFIRMATION',
    'DISASSEMBLING',
    'ERROR',
    'DONE',
];

async function sleep() {
    await new Promise((res) => setTimeout(res, 5000));
}

import { defineComponent } from 'vue';
import { getCurrentNetwork } from '@/chain/Network';
export default defineComponent({
    data() {
        return {
            name: '',
            pending_transaction: undefined as Transaction | undefined,
            exporting: 'CONFIRMATION' as ExportSteps,
            exportSteps,
            errorStep: undefined as undefined | ExportSteps,
            errorDetails: '',
            ogImage: '' as string,
            setId: '' as string,
        };
    },
    props: ['metadata'],
    emits: ['close', 'hide', 'show'],
    inject: ['messages', 'reportError', 'chainBriqs'],
    async beforeMount() {
        this.setId = this.metadata.set;

        this.name = this.set.name;
        this.pending_transaction = transactionsManager
            .get('export_set')
            .filter((x) => x.isOk() && x?.metadata?.setId === this.setId)?.[0];
        if (this.notEnoughBriqs)
            this.exporting = 'PRECHECKS';

        if (this.metadata.img) {
            let c = document.createElement('canvas');
            c.height = this.metadata.img.naturalHeight;
            c.width = this.metadata.img.naturalWidth;
            let ctx = c.getContext('2d')!;
            ctx.drawImage(this.metadata.img, 0, 0, c.width, c.height);
            this.ogImage = c.toDataURL();
        }
    },
    computed: {
        set() {
            return this.metadata.setData!;
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
            } catch (err) {
                return undefined;
            }
            return exportSet;
        },
    },
    methods: {
        step(step: ExportSteps) {
            return exportSteps.indexOf(step);
        },
        getStepIcon(step: ExportSteps) {
            if (this.errorStep) {
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
        exportSetLocally: function () {
            downloadJSON(this.set.serialize(), this.set.id + '.json');
        },
        exportSetOnChain: async function () {
            if (!contractStore.set)
                return;
            this.exporting = 'SIGNING';
            try {
                if (!this.exportSet)
                    throw new Error('The set could not be exported');
                // Update the name in case it changed.
                this.exportSet.name = this.set.name;
                let token_hint = this.exportSet.id;
                this.exportSet.id = contractStore.set.precomputeTokenId(walletStore.userWalletAddress, token_hint);

                let data = this.exportSet.serialize();

                const message = {
                    domain: {
                        name: 'briq',
                        chainId: false ? 1 : 3,
                        version: VERSION,
                    },
                    types: {
                        StarkNetDomain: [
                            { name: 'name', type: 'felt' },
                            { name: 'chainId', type: 'felt' },
                            { name: 'version', type: 'felt' },
                        ],
                        Message: [{ name: 'message', type: 'felt' }],
                    },
                    primaryType: 'Message',
                    message: {
                        message: 'mint_set',
                    },
                };

                let signature = await walletStore.signer!.signMessage(message);
                this.exporting = 'SENDING_TRANSACTION';

                await backendManager.storeSet({
                    owner: walletStore.userWalletAddress,
                    token_id: data.id,
                    chain_id: getCurrentNetwork(),
                    data: data,
                    message_hash: await walletStore.signer!.hashMessage(message),
                    signature: signature,
                    image_base64: this.ogImage,
                });

                // Debug
                //downloadJSON(data, data.id + ".json")
                let TX = await contractStore.set.assemble(
                    walletStore.userWalletAddress,
                    token_hint,
                    data.briqs.map((x: any) => x.data),
                    'https://api.briq.construction/' + backendManager.getMetadataRoute(data.id),
                );

                // Mark the transaction as waiting.
                new Transaction(TX.transaction_hash, 'export_set', { setId: data.id });

                this.pending_transaction = transactionsManager.getTx(TX.transaction_hash);

                this.exporting = 'WAITING_FOR_CONFIRMATION';
                await new Promise((resolve) => {
                    // Poll the transaction status regularly.
                    let regularly: any;
                    regularly = setInterval(async () => {
                        await this.pending_transaction!.poll();
                        if (this.pending_transaction!.isPending() || !this.pending_transaction!.isOk()) {
                            clearInterval(regularly);
                            resolve(null);
                        }
                    }, 3000);
                });
                this.messages.pushMessage('Set exported ' + data.id + ' - TX ' + TX.transaction_hash);

                this.exporting = 'DISASSEMBLING';
                let ids = [];
                this.set.forEach((briq, _) => {
                    ids.push(briq.legacy_id);
                });
                await legacySetsMgr.legacyContract.disassemble(walletStore.userWalletAddress, this.setId, ids);

                let info = setsManager.onSetMinted(null, this.exportSet);
                info.chain_owner = walletStore.userWalletAddress;
                this.setId = this.exportSet.id;
                this.$store.dispatch('builderData/select_set', this.exportSet.id);

                this.exporting = 'DONE';
            } catch (err) {
                this.messages.pushMessage('Error while exporting set - check browser console for details');
                this.reportError(err);
                console.error(err);
                this.errorDetails = err;
                this.errorStep = this.exporting;
                this.exporting = 'ERROR';
            }
        },
    },
    components: { BriqTable, RenameSet },
});
</script>
