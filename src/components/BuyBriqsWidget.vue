<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import * as starknet from 'starknet';
import { readableNumber, readableUnit } from '@/BigNumberForHumans';
import { userBalance } from '@/builder/UserBalance';
import { Fetchable } from '@/DataFetching';

import { briqFactory } from './BuyBriqSim';
import contractStore from '@/chain/Contracts';

const briqs_wanted = ref(300);

const slippage = ref(2); // as a per-mille.

const EthUsdPrice = reactive(new Fetchable());

const toggledDetails = ref(false);

const termsSale = ref(false);
const termsBriq = ref(false);

onMounted(async () => {
    // Update our understanding of USD/ETH
    EthUsdPrice.fetch(
        async () => 1 / +(await (await fetch('https://api.coinbase.com/v2/exchange-rates?currency=USD')).json())?.data?.rates?.ETH,
    )

/*let price = await contractStore.briq_factory?.get_price(1);
    if (price)
        last_know_price.value = starknet.number.toBN(price);
    */
})

const get_price_eth = (briqs: number) => {
    let price = starknet.number.toBN(briqFactory.getPrice(briqs));
    let slippage_value = price.mul(starknet.number.toBN(slippage.value)).div(starknet.number.toBN(1000));
    return price.add(slippage_value);
}

const surgePart = computed(() => {
    return starknet.number.toBN(briqFactory.getSurgePrice(briqs_wanted.value));
})

const regularPart = computed(() => {
    return get_price_eth(briqs_wanted.value).sub(surgePart.value);
})

const shareOfSurge = computed(() => {
    return surgePart.value.mul(starknet.number.toBN(1000)).div(get_price_eth(briqs_wanted.value)).toNumber() / 10;
})

const as_dollars = computed(() => {
    let price = get_price_eth(briqs_wanted.value).mul(
        starknet.number.toBN(EthUsdPrice._data * 10000000000|| 10000000000),
    ).div(starknet.number.toBN(10000000000));
    price = +readableNumber(price);
    if (price > 1000)
        return '~' + Math.round(price);
    return Math.round(price*100)/100;
})

const price_ber_briq = computed(() => {
    if (briqs_wanted.value == 0)
        return starknet.number.toBN(0);
    let price = get_price_eth(briqs_wanted.value);
    return price.div(starknet.number.toBN(briqs_wanted.value));
})

const balance = computed(() => {
    if (!userBalance.current?.balance._data)
        return '';
    return readableNumber(userBalance.current?.balance._data) + '\u00a0' + readableUnit(userBalance.current?.balance._data);
})

const buyBriqs = async () => {
    await contractStore.briq_factory?.buy(briqs_wanted.value);
}

</script>

<style scoped>
.activeTab::before {
    content:' ';
    @apply bg-grad-lightest absolute top-0 left-0 w-full h-12 z-[-1] rounded-tl rounded-tr;
}
</style>

<template>
    <div class="bg-grad-lighter rounded-md p-6">
        <div class="w-[24rem] m-auto">
            <div class="flex gap-0 text-sm">
                <p class="relative px-2 py-1 activeTab z-10">Buy</p>
                <p class="relative px-2 py-1 z-10 text-grad-dark">Sell (coming soon)</p>
            </div>
            <div class="bg-grad-lightest rounded-md">
                <div class="p-6">
                    <p class="flex flex-1 justify-between gap-4">
                        <span class="text-max font-medium">{{ readableNumber(get_price_eth(briqs_wanted)) }}</span>
                        <span class="text-max font-medium">ETH</span>
                    </p>
                    <p class="flex flex-1 items-center justify-between gap-4 mt-2 text-sm">
                        <span>{{ as_dollars }}$</span>
                        <span v-show="!!balance">Balance: {{ balance }}</span>
                    </p>
                </div>
                <div class="relative">
                    <hr class="my-2 h-[2px] bg-grad-lighter">
                    <i class="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] fas fa-arrow-down bg-grad-lightest p-1 border border-grad-light rounded"/>
                </div>
                <div class="p-6">
                    <p class="flex flex-1 justify-between gap-4">
                        <input class="text-max text-grad-darkest font-medium px-2 py-1 w-full" type="text" v-model="briqs_wanted">
                        <span class="text-max font-medium">briqs</span>
                    </p>
                </div>
            </div>
        </div>
        <div class="my-4 text-sm flex justify-between items-center gap-8">
            <div>
                <p>The price shown is the maximum, but you may end up paying less depending on actual slippage.</p>
                <p class="mt-1">1 briq = {{ readableNumber(price_ber_briq) }} {{ readableUnit(price_ber_briq) }} ({{ shareOfSurge }}‰ due to surge costs)</p>
            </div>
            <i @click.stop.prevent="toggledDetails=!toggledDetails" :class="`p-2 cursor-pointer hover:bg-grad-light rounded fa-solid fa-chevron-${toggledDetails ? 'up' : 'down'}`"/>
        </div>
        <div class="text-sm" v-show="toggledDetails">
            <p>Impact on price: {{ readableNumber(briqFactory.getPriceAfter(briqs_wanted)) }}</p>
            <p>Max slippage on price: <input type="number" class="text-xs p-1 px-2 m-0 w-14" v-model="slippage"></p>
        </div>
        <div v-show="shareOfSurge > 10" class="my-4 bg-grad-lightest border-2 border-info-error rounded p-4">
            <p>Warning: prices are exceptionally high because of unexpected demand.<br>Come back in a few hours for lower prices.</p>
            <p>Surge amount: {{ readableNumber(surgePart) }} {{ readableUnit(surgePart) }} ({{ surgePart.mul(starknet.number.toBN(1000)).div(get_price_eth(briqs_wanted)).toNumber() / 10 }}%)</p>
        </div>
        <div class="text-sm flex flex-col gap-1 my-4">
            <p class="flex items-center gap-1"><Toggle v-model="termsBriq" class="w-10 mr-2"/>I agree to the <RouterLink class="text-primary" :to="{ name: 'Legal Doc', params: { doc: '2022-09-23-terms-conditions' } }">briq terms of use</RouterLink></p>
            <p class="flex items-center gap-1"><Toggle v-model="termsSale" class="w-10 mr-2"/>I agree to the <RouterLink class="text-primary" :to="{ name: 'Legal Doc', params: { doc: '2022-08-16-terms-of-sale' } }">NFT sale terms</RouterLink></p>
        </div>
        <Btn class="w-full" :disabled="!termsSale || !termsBriq" @click="buyBriqs">Buy</Btn>
    </div>
</template>
