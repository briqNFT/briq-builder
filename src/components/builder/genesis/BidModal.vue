<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import WindowVue from '@/components/generic/Window.vue';
import { productBidsStore, userBidsStore } from '@/builder/BidStore';
import { userBalance } from '@/builder/UserBalance.js';
import { toBN } from 'starknet/utils/number.js';
import { useBids } from '@/components/BidComposable.js';
defineEmits(['close']);

const step = ref('MAKE_BID' as 'MAKE_BID' | 'SIGNING' | 'PROCESSING' | 'BID_COMPLETE');

const props = defineProps<{
    metadata: {
        item: string,
    },
}>();

const { currentBid, currentBidString } = useBids(props.metadata.item);

const bid = ref(undefined as undefined | number);

const weiBid = computed(() => {
    const stringBid = (+bid.value).toString().split('.');
    if (stringBid.length === 1)
        return toBN(stringBid[0]).mul(toBN('1000000000000000000'));
    const intpart = stringBid[0];
    const fractpart = stringBid[1].padEnd(18, '0');
    return toBN(intpart).mul(toBN('1000000000000000000')).add(toBN(fractpart));
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


const makeBid = async () => {
    step.value = 'SIGNING';
    try {
        let tx = await userBidsStore.current?.makeBid(weiBid.value, props.metadata.item);
        console.log(tx);
        step.value = 'PROCESSING';
    } catch(err) {
        console.error(err);
        step.value = 'MAKE_BID';
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
                <p class="text-right text-sm text-darkest">Available: Ξ {{ balance }}</p>
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
                You can check the status of your transaction from the profile dropdown.
            </p>

            <p>See transaction on <a href="">Voyager</a></p>

            <p>You can now close this pop-up.</p>
        </div>
    </WindowVue>
    <WindowVue v-else-if="step === 'BID_COMPLETE'" :size="'md:w-[40rem]'">
        <template #big-title>Transaction complete <i class="fa-regular fa-circle-check"/></template>
        <div class="flex flex-col gap-8">
            <p>Your bid of {{ 3.24 }} <i class="fa-brands fa-ethereum"/> is confirmed.</p>
            <p>Come back in X hours and check if you've won!</p>

            <p>See transaction on <a href="">Voyager</a></p>

            <p>You can now close this pop-up.</p>
        </div>
    </WindowVue>
</template>