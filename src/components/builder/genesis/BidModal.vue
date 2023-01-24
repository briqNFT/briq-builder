<script setup lang="ts">
import { computed, h, Ref, ref, watchEffect } from 'vue';
import WindowVue from '@/components/generic/Window.vue';
import { AuctionItemData, Bid, userBidsStore2 as userBidsStore, userBidsStore2 } from '@/builder/AuctionData';
import { userBalance } from '@/builder/UserBalance.js';
import * as starknet from 'starknet';
import { useBids } from '@/components/BidComposable.js';
import { fromETH, readableNumber, readableUnit } from '@/BigNumberForHumans';
import { HashVue, pushPopup } from '@/Notifications';
import { ExplorerTxUrl } from '@/chain/Explorer';
import { auctionDataStore } from '@/builder/AuctionData';

defineEmits(['close']);

const step = ref('MAKE_BID' as 'MAKE_BID' | 'SIGNING' | 'PROCESSING' | 'PENDING' | 'BID_COMPLETE' | 'ERROR');

const props = defineProps<{
    item: string,
    name: string,
}>();

const termsSale = ref(false);
const termsBriq = ref(false);

const auctionData = computed(() => {
    return auctionDataStore['starknet-testnet'][props.item].auctionData(props.item)._data;
});

const currentBid = computed(() => starknet.number.toBN(auctionData.value?.highest_bid || '0'));
const currentBidString = computed(() => `${readableNumber(auctionData.value?.highest_bid || '0')} ${readableUnit(auctionData.value?.highest_bid || '0')}`);

const minNewBid = computed(() => {
    if (auctionData.value?.highest_bid === '0')
        return starknet.number.toBN(auctionData.value?.minimum_bid || '0');
    const mb = currentBid.value;
    const gr = mb.mul(starknet.number.toBN(auctionData.value?.growth_factor || 10)).idivn(starknet.number.toBN(1000));
    return mb.add(gr);
});

// Actual current bid, as a string. Set by the input.
// This should convert to ETH and not WEI/GWEI, but for practical values it won't matter since everything will be ETH.
const bid = ref(readableNumber(minNewBid.value) || undefined as undefined | string);

// Use this for actual calculations
const weiBid = computed(() => {
    return fromETH(bid.value?.toString() || '0');
})

const balance = computed(() => userBalance.current?.asEth());

const yourCurrentBid = computed(() => starknet.number.toBN(userBidsStore2.current?.getBid(props.item)?.bid_amount));
const yourMaxBid = computed(() => {
    if (currentBid.value.cmp(yourCurrentBid.value) === 0)
        return starknet.number.toBN(userBalance.current?.balance._data).add(yourCurrentBid.value);
    return starknet.number.toBN(userBalance.current?.balance._data);
});

const canMakeBid = computed(() => {
    if (!termsBriq.value || !termsSale.value)
        return false;
    return !canMakeBidReason.value;
})

const canMakeBidReason = computed(() => {
    if (bid.value === undefined)
        return undefined;
    if (balance.value && weiBid.value.cmp(yourMaxBid.value) > 0)
        return 'Bid is greater than your balance';
    if (weiBid.value.cmp(minNewBid.value) < 0)
        return 'Bid must be more than the current bid + 1%';
    return undefined;
})

let newBid;
const ongoingBid = computed(() => {
    return userBidsStore.current?.metadata[props.item] || newBid;
});

const makeBid = async () => {
    step.value = 'SIGNING';
    try {
        newBid = await userBidsStore.current!.makeBid(weiBid.value, props.item);
        step.value = 'PROCESSING';
        pushPopup('info', 'Transaction sent', HashVue(newBid!.tx_hash));

        let watcher: any;
        watcher = watchEffect(() => {
            if (ongoingBid.value?.status === 'PENDING')
                step.value = 'PENDING';
            else if (ongoingBid.value?.status === 'CONFIRMED') {
                watcher();
                step.value = 'BID_COMPLETE';
            } else if (ongoingBid.value?.status === 'REJECTED') {
                watcher();
                step.value = 'ERROR';
            }
        })
    } catch(err) {
        console.error(err);
        step.value = 'ERROR';
        pushPopup('error', 'Error sending TX', `An error happened while sending the transaction:\n${err}`);
    }
}
</script>

<template>
    <WindowVue v-if="step === 'MAKE_BID' || step === 'SIGNING'" :size="'md:w-[40rem]'">
        <template #title>Place a bid {{ name ? `on ${name}` : '' }}</template>
        <div class="flex flex-col gap-8">
            <div v-if="auctionData?.highest_bid !== '0'" class="flex flex-col items-center gap-2">
                <p class="text-md">Current winning bid</p>
                <p class="text-lg font-semibold">{{ currentBidString }}</p>
            </div>
            <div v-else class="flex flex-col items-center gap-2">
                <p class="text-md">Set the first bid !</p>
                <p class="text-sm">Minimum bid is {{ readableNumber(auctionData.minimum_bid) }} {{ readableUnit(auctionData.minimum_bid) }}</p>
            </div>
            <div>
                <p>
                    <input :disabled="step === 'SIGNING'" class="w-full my-2" type="number" :min="readableNumber(minNewBid)" step="0.01" v-model="bid" :placeholder="`Bid ${readableNumber(minNewBid)} ${readableUnit(minNewBid)} or more`">
                </p>
                <p class="flex justify-between text-sm text-grad-dark gap-2">
                    <span v-if="!!yourCurrentBid">Your last bid: {{ readableNumber(yourCurrentBid) }} {{ readableUnit(yourCurrentBid) }}</span>
                    <span v-if="balance">You can bid up to {{ readableNumber(yourMaxBid) }} {{ readableUnit(yourMaxBid) }}</span>
                </p>
            </div>
            <div class="text-sm flex flex-col gap-4">
                <p class="flex items-center gap-1"><Toggle v-model="termsBriq" class="w-10 mr-2"/>I agree to the <RouterLink class="text-primary" :to="{ name: 'Legal Doc', params: { doc: '2022-09-23-terms-conditions' } }">briq terms of use</RouterLink></p>
                <p class="flex items-center gap-1"><Toggle v-model="termsSale" class="w-10 mr-2"/>I agree to the <RouterLink class="text-primary" :to="{ name: 'Legal Doc', params: { doc: '2022-08-16-terms-of-sale' } }">NFT sale terms</RouterLink></p>
            </div>
            <div class="flex justify-end items-center gap-4">
                <p v-if="canMakeBidReason" class="text-red-300 text-sm">{{ canMakeBidReason }}</p>
                <Btn secondary class="font-normal" @click="$emit('close')">Cancel</Btn>
                <Btn :disabled="!canMakeBid || step === 'SIGNING'" @click="makeBid">Bid {{ readableNumber(weiBid) }} {{ readableUnit(weiBid) }}</Btn>
            </div>
        </div>
    </WindowVue>
    <WindowVue v-else-if="step === 'PROCESSING'" :size="'md:w-[40rem]'">
        <template #title>Transaction processing</template>
        <div class="flex flex-col gap-8">
            <p>
                Your transaction has been sent and should be confirmed shortly.
            </p>
            <p>TX hash: {{ ongoingBid?.tx_hash }}</p>
            <p>See transaction on <a class="text-primary" :href="ExplorerTxUrl(ongoingBid!.tx_hash)" target="_blank">Starkscan</a></p>

            <p>You can now close this pop-up.</p>
        </div>
    </WindowVue>
    <WindowVue v-else-if="step === 'PENDING'" :size="'md:w-[40rem]'">
        <template #title>Transaction pending <i class="mx-2 far fa-circle-check text-info-success"/></template>
        <div class="flex flex-col gap-8">
            <p>
                Your bid of {{ readableNumber(weiBid) }} {{ readableUnit(weiBid) }} will be confirmed soon.<br>
                In a few more seconds, it will appear in the list of bids.
            </p>
            <p>See transaction on <a class="text-primary" :href="ExplorerTxUrl(ongoingBid!.tx_hash)" target="_blank">Starkscan</a></p>

            <p>You can now close this pop-up.</p>
        </div>
    </WindowVue>
    <WindowVue v-else-if="step === 'BID_COMPLETE'" :size="'md:w-[40rem]'">
        <template #title>Transaction complete <i class="mx-2 far fa-circle-check text-info-success"/></template>
        <div class="flex flex-col gap-8">
            <p>Your bid of {{ readableNumber(weiBid) }} {{ readableUnit(weiBid) }} is confirmed.</p>
            <p>See transaction on <a class="text-primary" :href="ExplorerTxUrl(ongoingBid!.tx_hash)" target="_blank">Starkscan</a></p>

            <p>You can now close this pop-up.</p>
        </div>
    </WindowVue>
    <WindowVue v-else-if="step === 'ERROR'" :size="'md:w-[40rem]'">
        <template #big-title>Error <i class="far fa-circle-exclamation text-info-error"/></template>
        <div class="flex flex-col gap-8">
            <p>Unfortunately, there was an error while processing your bid.</p>
            <p><Btn primary @click="step = 'MAKE_BID'">Go back</Btn></p>
        </div>
    </WindowVue>
</template>