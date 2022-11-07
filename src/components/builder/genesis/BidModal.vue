<script setup lang="ts">
import { computed, h, Ref, ref, watchEffect } from 'vue';
import WindowVue from '@/components/generic/Window.vue';
import { Bid, userBidsStore } from '@/builder/BidStore';
import { userBalance } from '@/builder/UserBalance.js';
import { toBN } from 'starknet/utils/number';
import { useBids } from '@/components/BidComposable.js';
import { fromETH, readableNumber } from '@/BigNumberForHumans';
import { HashVue, pushPopup } from '@/Notifications';
import { ExplorerTxUrl } from '@/chain/Explorer';
defineEmits(['close']);

const step = ref('MAKE_BID' as 'MAKE_BID' | 'SIGNING' | 'PROCESSING' | 'PENDING' | 'BID_COMPLETE' | 'ERROR');

const props = defineProps<{
    metadata: {
        item: string,
    },
}>();

const { currentBid, currentBidString } = useBids(props.metadata.item);

const bid = ref(readableNumber(currentBid.value) || undefined as undefined | string);

const weiBid = computed(() => {
    return fromETH(bid.value?.toString() || '0');
})

const balance = computed(() => userBalance.current?.asEth());

const canMakeBid = computed(() => {
    return balance.value && bid.value !== undefined &&
        weiBid.value.cmp(toBN(userBalance.current?.balance._data)) <= 0 &&
        weiBid.value.cmp(currentBid.value) > 0;
})

const canMakeBidReason = computed(() => {
    if (bid.value === undefined)
        return undefined;
    if (!balance.value)
        return 'Unknown balance';
    if (weiBid.value.cmp(toBN(userBalance.current?.balance._data)) > 0)
        return 'Bid is greater than your balance';
    if (weiBid.value.cmp(currentBid.value) <= 0)
        return 'Bid must be more than the current bid';
    return undefined;
})

const ongoingBidData = ref(undefined as undefined | Bid);
const ongoingBid = computed(() => {
    return userBidsStore.current?.bids.filter(bid => {
        return bid.box_id === ongoingBidData.value?.box_id && bid.tx_hash == ongoingBidData.value?.tx_hash;
    })?.[0];
});

const makeBid = async () => {
    step.value = 'SIGNING';
    try {
        let newBid = await userBidsStore.current?.makeBid(weiBid.value, props.metadata.item);
        ongoingBidData.value = newBid;
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
        <template #big-title>Place a bid</template>
        <div class="flex flex-col gap-8">
            <div class="flex flex-col items-center gap-2">
                <p class="text-md">Current winning bid</p>
                <p class="text-lg font-semibold">{{ currentBidString }}</p>
            </div>
            <div>
                <p>
                    Make your bid<br>
                    <input :disabled="step === 'SIGNING'" class="w-full my-2" type="number" min="0" :max="balance" step="0.1" v-model="bid" :placeholder="`Bid Ξ ${1.35} or more`">
                </p>
                <p class="text-right text-sm text-grad-darker">Available: Ξ {{ balance }}</p>
            </div>
            <div class="flex justify-end items-center gap-4">
                <p v-if="canMakeBidReason" class="text-red-300 text-sm">{{ canMakeBidReason }}</p>
                <Btn secondary @click="$emit('close')">Cancel</Btn>
                <Btn :disabled="!canMakeBid || step === 'SIGNING'" @click="makeBid">Place a bid</Btn>
            </div>
        </div>
    </WindowVue>
    <WindowVue v-else-if="step === 'PROCESSING'" :size="'md:w-[40rem]'">
        <template #big-title>Transaction processing</template>
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
        <template #big-title>Transaction pending <i class="far fa-circle-check text-info-success"/></template>
        <div class="flex flex-col gap-8">
            <p>
                Your bid of {{ 3.24 }} <i class="fa-brands fa-ethereum"/> is confirmed.<br>
                In a few more seconds, it will appear in the list of bids.
            </p>
            <p>Come back in X hours and check if you've won!</p>
            <p>See transaction on <a class="text-primary" :href="ExplorerTxUrl(ongoingBid!.tx_hash)" target="_blank">Starkscan</a></p>

            <p>You can now close this pop-up.</p>
        </div>
    </WindowVue>
    <WindowVue v-else-if="step === 'BID_COMPLETE'" :size="'md:w-[40rem]'">
        <template #big-title>Transaction complete <i class="far fa-circle-check text-info-success"/></template>
        <div class="flex flex-col gap-8">
            <p>Your bid of {{ 3.24 }} <i class="fa-brands fa-ethereum"/> is confirmed.</p>
            <p>Come back in X hours and check if you've won!</p>
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