<script setup lang="ts">
import { useBoxData, CARD_MODES } from '@/builder/BoxData';

import { computed, ref, watch } from 'vue';
import WindowVue from '@/components/generic/Window.vue';
import { userBidsStore } from '@/builder/BidStore';
import { userBalance } from '@/builder/UserBalance.js';
import { toBN } from 'starknet/utils/number.js';
defineEmits(['close']);

const {
    genesisStore,
    itemQuery,
    item,
    saleQuery,
    saledata,
    getActualMode,
    durationLeft,
} = useBoxData(props.metadata.item);

const step = ref('MAKE_BID' as 'MAKE_BID' | 'SIGNING' | 'PROCESSING' | 'BID_COMPLETE');

const props = defineProps<{
    metadata: {
        item: string,
    },
}>();

const balance = computed(() => userBalance.current?.asEth());

const weiPrice = computed(() => toBN('1450000000000000000'))

const canMakeBid = computed(() => {
    return balance.value && toBN(userBalance.current?.balance._data).cmp(weiPrice) >= 0;
})

const canMakeBidReason = computed(() => {
    if (!balance.value)
        return 'Unknown balance';
    if (toBN(userBalance.current?.balance._data).cmp(weiPrice) < 0)
        return 'Insufficient balance';
    return undefined;
})



const makeBid = async () => {
    step.value = 'SIGNING';
    try {
        const itemData = genesisStore.metadata[props.metadata.item]._data!;
        const contractStore = (await import('@/Dispatch')).contractStore;
        const tx_response = await contractStore.auction?.approveAndBid(contractStore.eth_bridge_contract, itemData.token_id, itemData.auction_id, weiPrice.value.toString())
        console.log('tx_response', tx_response);
        step.value = 'PROCESSING';
    } catch(err) {
        console.error(err);
        step.value = 'MAKE_BID';
    }
}
</script>

<template>
    <WindowVue v-if="step === 'MAKE_BID' || step === 'SIGNING'" :size="'md:w-[40rem]'">
        <template #title>Complete checkout</template>
        <div class="flex flex-col gap-8">
            <h3 class="m-0 p-0">Item</h3>
            <hr>
            <div class="flex gap-4 justify-between">
                <p><img class="p-8 rounded border border-grad-darker max-h-[120px]" :src="genesisStore.coverItemRoute(props.metadata.item)"></p>
                <div class="flex-1"><h4>{{ props.metadata.item?.split("/")?.[0] }}</h4><h2>{{ item?.name }}</h2></div>
                <p>1.35 ETH</p>
            </div>
        </div>
        <div class="flex justify-end items-center gap-4">
            <p v-if="canMakeBidReason" class="text-red-300 text-sm">{{ canMakeBidReason }}</p>
            <Btn secondary @click="$emit('close')">Cancel</Btn>
            <Btn :disabled="!canMakeBid || step === 'SIGNING'" @click="makeBid">Buy now</Btn>
        </div>
    </WindowVue>
    <WindowVue v-else-if="step === 'PROCESSING'" :size="'md:w-[40rem]'">
        <template #title>Transaction processing</template>
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
            <p>Congratulations! You are now the proud owner of a briq Genesis Set.</p>

            <p>See transaction on <a href="">Voyager</a></p>

            <p>You can now close this pop-up.</p>
        </div>
    </WindowVue>
</template>