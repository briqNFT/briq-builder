<script setup lang="ts">
import { useBoxData, CARD_MODES } from '@/builder/BoxData';

import { computed, ref, watch, watchEffect } from 'vue';
import WindowVue from '@/components/generic/Window.vue';
import { userBidsStore } from '@/builder/BidStore';
import { userBalance } from '@/builder/UserBalance.js';
import { toBN } from 'starknet/utils/number.js';
import { fromETH, readableNumber, readableUnit } from '@/BigNumberForHumans';
import { Purchase, userPurchaseStore } from '@/builder/UserPurchase';
import { pushPopup } from '@/Notifications';
import { ExplorerTxUrl } from '@/chain/Explorer';
defineEmits(['close']);

const {
    genesisStore,
    itemQuery,
    themeID,
    themeData,
    item,
    saleQuery,
    saledata,
    getActualMode,
    durationLeft,
} = useBoxData(props.metadata.item);

const step = ref('MAKE_BID' as 'MAKE_BID' | 'SIGNING' | 'PROCESSING' | 'BID_COMPLETE' | 'ERROR');

const props = defineProps<{
    metadata: {
        item: string,
    },
}>();

const balance = computed(() => userBalance.current?.asEth());

const weiPrice = computed(() => toBN(Math.floor(saledata.value?.price || 0).toString()))

const canMakeBid = computed(() => {
    return balance.value && toBN(userBalance.current?.balance._data).cmp(weiPrice) >= 0;
})

const canMakeBidReason = computed(() => {
    if (!balance.value)
        return undefined;
    if (toBN(userBalance.current?.balance._data).cmp(weiPrice) < 0)
        return 'Insufficient balance';
    return undefined;
})


const ongoingBidData = ref(undefined as undefined | string);
const ongoingBid = computed(() => {
    if (ongoingBidData.value)
        return userPurchaseStore.current?.purchases[ongoingBidData.value];
    return undefined;
});


const makeBid = async () => {
    step.value = 'SIGNING';
    try {
        let purchase = await userPurchaseStore.current!.makePurchase(props.metadata.item, weiPrice.value.toString())
        ongoingBidData.value = purchase.tx_hash;
        step.value = 'PROCESSING';
        pushPopup('info', 'Transaction sent', `Transaction was sent.\nHash: ${purchase.tx_hash}`)
        let watcher: any;
        watcher = watchEffect(() => {
            if (ongoingBid.value?.status === 'CONFIRMED') {
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
        <template #title>Complete checkout</template>
        <h4 class="m-0 mb-2 p-0 text-sm font-semibold">Item</h4>
        <hr class="mb-4">
        <div class="flex gap-4 justify-between">
            <p><img class="p-8 rounded border border-grad-light max-h-[120px]" :src="genesisStore.coverItemRoute(props.metadata.item)"></p>
            <div class="flex-1">
                <router-link :to="{ name: 'Theme', params: { theme: themeID } }"><h5 class="text-primary text-xs">{{ themeData?.name }}</h5></router-link>
                <h4 class="test-sm font-semibold mt-2">{{ item?.name }}</h4>
            </div>
            <p>
                {{ readableNumber(weiPrice) }} {{ readableUnit(weiPrice) }}
            </p>
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

            <p>See transaction on <a class="text-primary" :href="ExplorerTxUrl(ongoingBid!.tx_hash)">StarkScan</a></p>

            <p>You can now close this pop-up.</p>
        </div>
    </WindowVue>
    <WindowVue v-else-if="step === 'BID_COMPLETE'" :size="'md:w-[40rem]'">
        <template #big-title>Transaction complete <i class="fa-regular fa-circle-check"/></template>
        <div class="flex flex-col gap-8">
            <p>Congratulations! You are now the proud owner of a briq Genesis Set.</p>

            <p>See transaction on <a class="text-primary" :href="ExplorerTxUrl(ongoingBid!.tx_hash)">StarkScan</a></p>

            <p>You can now close this pop-up.</p>
        </div>
    </WindowVue>
    <WindowVue v-else-if="step === 'ERROR'" :size="'md:w-[40rem]'">
        <template #big-title>Error <i class="fas fa-circle-exclamation text-info-error"/></template>
        <div class="flex flex-col gap-8">
            <p>Unfortunately, there was an error while processing your purchase.</p>
            <p><Btn primary @click="step = 'MAKE_BID'">Go back</Btn></p>
        </div>
    </WindowVue>
</template>