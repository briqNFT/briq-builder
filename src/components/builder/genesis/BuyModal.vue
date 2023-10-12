<script setup lang="ts">
import { useBoxData, CARD_MODES } from '@/builder/BoxData';

import { computed, onUnmounted, ref, watchEffect } from 'vue';
import WindowVue from '@/components/generic/Window.vue';
import { userBalance } from '@/builder/UserBalance.js';
import * as starknet from 'starknet';
import { fromETH, readableNumber, readableUnit } from '@/BigNumberForHumans';
import { Purchase, userPurchaseStore } from '@/builder/UserPurchase';
import { HashVue, pushPopup } from '@/Notifications';
import { ExplorerTxUrl } from '@/chain/Explorer';
import { router } from '@/Routes';
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

const termsSale = ref(false);
const termsBriq = ref(false);

const weiPrice = computed(() => BigInt(Math.floor(saledata.value?.price || 100).toString()))

const canMakeBid = computed(() => {
    if (!termsBriq.value || !termsSale.value)
        return false;
    return userBalance.current?.balance?._status !== 'LOADED' || BigInt(userBalance.current?.balance._data) >= weiPrice.value;
})

const canMakeBidReason = computed(() => {
    if (userBalance.current?.balance?._status == 'LOADED' && BigInt(userBalance.current?.balance?._data) < weiPrice.value)
        return 'Insufficient balance';
    return undefined;
})

const ongoingBidData = ref(undefined as undefined | string);
const ongoingBid = computed(() => {
    if (ongoingBidData.value)
        return userPurchaseStore.current?.purchases[ongoingBidData.value];
    return undefined;
});

let redirectOnClose = false;

const makeBid = async () => {
    step.value = 'SIGNING';
    try {
        let purchase = await userPurchaseStore.current!.makePurchase(props.metadata.item, weiPrice.value.toString())
        ongoingBidData.value = purchase.tx_hash;
        step.value = 'PROCESSING';
        redirectOnClose = true;
        pushPopup('info', 'Transaction sent', HashVue(purchase!.tx_hash));
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

onUnmounted(() => {
    if (redirectOnClose)
        router.push(`/box/${props.metadata.item}`);
})
</script>

<template>
    <WindowVue v-if="step === 'MAKE_BID' || step === 'SIGNING'" :size="'md:w-[40rem]'">
        <template #title>Complete checkout</template>
        <h4 class="m-0 mb-2 p-0 text-sm font-semibold">Item</h4>
        <hr class="mb-4">
        <div class="flex gap-4 justify-between">
            <p><img class="p-0 rounded border border-grad-light max-h-[120px]" :src="genesisStore.coverBoxRoute(props.metadata.item, true)"></p>
            <div class="flex-1">
                <router-link :to="{ name: 'Theme', params: { theme: themeID } }"><h5 class="text-primary text-xs">{{ themeData?.name }}</h5></router-link>
                <h4 class="test-sm font-semibold mt-2">{{ item?.name }}</h4>
                <p class="text-sm mt-2">{{ item?.description }}</p>
            </div>
            <p>
                {{ readableNumber(weiPrice) }} {{ readableUnit(weiPrice) }}
            </p>
        </div>
        <div class="text-sm flex flex-col gap-4 my-6">
            <p class="flex items-center gap-1"><Toggle v-model="termsBriq" class="w-10 mr-2"/>I agree to the <RouterLink class="text-primary" :to="{ name: 'Legal Doc', params: { doc: '2022-09-23-terms-conditions' } }">briq terms of use</RouterLink></p>
            <p class="flex items-center gap-1"><Toggle v-model="termsSale" class="w-10 mr-2"/>I agree to the <RouterLink class="text-primary" :to="{ name: 'Legal Doc', params: { doc: '2022-08-16-terms-of-sale' } }">NFT sale terms</RouterLink></p>
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
            <p>Your transaction has been broadcasted and should be confirmed shortly.</p>

            <p>See transaction on <a class="text-primary" :href="ExplorerTxUrl(ongoingBid!.tx_hash)" target="_blank">Starkscan</a></p>

            <p>Closing this modal will redirect you to the Box product page, where you can unbox it!</p>
        </div>
    </WindowVue>
    <WindowVue v-else-if="step === 'BID_COMPLETE'" :size="'md:w-[40rem]'">
        <template #big-title>Transaction complete <i class="fa-regular fa-circle-check"/></template>
        <div class="flex flex-col gap-8">
            <p>Congratulations! You are now the proud owner of a briq Genesis Set.</p>

            <p>See transaction on <a class="text-primary" :href="ExplorerTxUrl(ongoingBid!.tx_hash)" target="_blank">Starkscan</a></p>

            <p>Closing this modal will redirect you to the Box product page, where you can unbox it!</p>
        </div>
    </WindowVue>
    <WindowVue v-else-if="step === 'ERROR'" :size="'md:w-[40rem]'">
        <template #big-title>Error <i class="ml-2 far fa-circle-exclamation text-info-error"/></template>
        <div class="flex flex-col gap-8">
            <p>Unfortunately, there was an error while processing your purchase.</p>
            <p><Btn primary @click="step = 'MAKE_BID'">Go back</Btn></p>
        </div>
    </WindowVue>
</template>