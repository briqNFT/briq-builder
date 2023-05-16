<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import * as starknet from 'starknet';
import { readableNumber, readableUnit } from '@/BigNumberForHumans';
import { userBalance } from '@/builder/UserBalance';
import { Fetchable } from '@/DataFetching';

import { briqFactory } from './BuyBriqSim';
import contractStore from '@/chain/Contracts';
import Toggle from './generic/Toggle.vue';
import { ExplorerTxUrl } from '@/chain/Explorer';
import { chainBriqs } from '@/builder/ChainBriqs';

const briqs_wanted = ref(300);

const slippage = ref(2); // as a per-mille.

const EthUsdPrice = reactive(new Fetchable());

const toggledDetails = ref(false);
const toggledSettings = ref(false);

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

const impactOnPrice = computed(() => {
    let price = get_price_eth(1);
    let delta = starknet.number.toBN(briqFactory.getPriceAfter(briqs_wanted.value)).sub(price);
    if (delta.cmp(starknet.number.toBN('100000000000000')) < 0)
        return starknet.number.toBN(0);
    return delta;
})

const shareOfSurge = computed(() => {
    const price = get_price_eth(briqs_wanted.value);
    if (price.isZero())
        return 0;
    return surgePart.value.mul(starknet.number.toBN(1000)).div(price).toNumber() / 10;
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

const transaction = ref(new Fetchable<string>());
const buyBriqs = async () => {
    transaction.value.clear();
    await transaction.value.fetch(async () => {
        let tx = await contractStore.briq_factory?.buy(contractStore.eth_bridge_contract!, briqs_wanted.value, get_price_eth(briqs_wanted.value));
        chainBriqs.value?.show('0x1', briqs_wanted.value, tx!.transaction_hash, true);
        return tx!.transaction_hash;
    });
}
const cancelBuy = () => {
    transaction.value = new Fetchable<string>();
}

</script>

<style scoped>
.activeTab::before {
    content:' ';
    @apply bg-grad-lightest absolute top-0 left-0 w-full h-12 z-[-1] rounded-tl rounded-tr;
}
.overlay::before {
    content: ' ';
    @apply z-[-1] absolute top-0 left-0 w-full h-full bg-grad-lighter opacity-50 rounded-md border border-grad-light;
}
.overlay {
    @apply absolute p-2 top-0 left-0 w-full h-full z-20 flex justify-center items-center;
}
</style>

<template>
    <div class="bg-grad-lighter rounded-md px-7 py-6 relative">
        <div class="m-auto relative">
            <div class="flex justify-between">
                <div class="flex gap-0 font-medium relative">
                    <p class="relative px-2 py-1 activeTab z-10">Buy</p>
                    <!--<p class="relative px-2 py-1 z-10 text-grad-dark">Sell</p>-->
                </div>
                <div class="flex items-center">
                    <Btn secondary @click="toggledSettings = !toggledSettings" class="p-1 h-auto w-auto text-xs"><i class="far fa-gear"/></Btn>
                </div>
            </div>
            <div v-show="toggledSettings" class="absolute top-8 right-2 z-10 p-4 rounded shadow-md bg-grad-lightest border border-grad-lighter">
                <p class="leading-normal">
                    Max price slippage:<br>
                    <span class="flex justify-between items-center">
                        <span><input class="mr-1 w-20" type="number" v-model="slippage">‰</span>
                        <Btn :disabled="slippage === 2" @click="slippage = 2" no-background class="ml-2 p-2 h-auto">
                            <i class="text-sm p-0 fa-solid fa-arrows-rotate"/>
                        </Btn>
                    </span>
                </p>
            </div>
            <div class="bg-grad-lightest rounded-md">
                <div class="p-6">
                    <p class="flex flex-1 justify-between items-center gap-4">
                        <span class="text-2xl font-medium">{{ readableNumber(get_price_eth(briqs_wanted)) }}</span>
                        <span class="text-2xl font-medium">ETH</span>
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
                    <p class="flex flex-1 justify-between items-center gap-4">
                        <input class="text-2xl text-grad-darkest font-medium px-2 py-1 w-full" type="number" :min="200" :max="1000000" v-model="briqs_wanted">
                        <span class="text-2xl font-medium">briqs</span>
                    </p>
                </div>
            </div>
        </div>
        <div class="my-4 text-sm flex justify-between items-center gap-8">
            <div>
                <p class="mt-1">1 briq = {{ readableNumber(price_ber_briq) }} {{ readableUnit(price_ber_briq) }}</p>
                <p>The price shown is the maximum, but you may end up paying less depending on actual slippage.</p>
            </div>
            <i @click.stop.prevent="toggledDetails=!toggledDetails" :class="`p-2 cursor-pointer hover:bg-grad-light rounded fa-solid fa-chevron-${toggledDetails ? 'up' : 'down'}`"/>
        </div>
        <div class="text-sm" v-show="toggledDetails">
            <p>Additional cost due to surge demand: {{ readableNumber(surgePart) }} {{ readableUnit(surgePart) }}</p>
            <p>Impact on price: {{ readableNumber(impactOnPrice) }} {{ readableUnit(impactOnPrice) }}</p>
        </div>
        <div v-show="shareOfSurge > 10" class="my-4 bg-grad-lightest border-2 border-info-error rounded p-4">
            <p>Warning: prices are exceptionally high because of unexpected demand.<br>Come back in a few hours for lower prices.</p>
            <p>Surge amount: {{ readableNumber(surgePart) }} {{ readableUnit(surgePart) }} ({{ shareOfSurge }}%)</p>
        </div>
        <div class="text-sm flex flex-col gap-1 my-4">
            <p class="flex items-center gap-1"><Toggle v-model="termsBriq" class="w-10 mr-2"/>I agree to the <RouterLink class="text-primary" :to="{ name: 'Legal Doc', params: { doc: '2022-09-23-terms-conditions' } }">briq terms of use</RouterLink></p>
            <p class="flex items-center gap-1"><Toggle v-model="termsSale" class="w-10 mr-2"/>I agree to the <RouterLink class="text-primary" :to="{ name: 'Legal Doc', params: { doc: '2022-08-16-terms-of-sale' } }">NFT sale terms</RouterLink></p>
        </div>
        <Btn class="w-full" :disabled="!termsSale || !termsBriq" @click="buyBriqs">Buy</Btn>
        <div v-if="transaction._data" class="overlay">
            <div class="bg-grad-lightest shadow-md rounded p-8 text-center">
                <h4>Transaction submitted</h4>
                <p class="mt-2 text-primary text-sm"><a :href="ExplorerTxUrl(transaction._data)" target="_blank">View on Starkscan</a></p>
                <p class="mt-4 mb-2">Your briq balance is already updated,<br>assuming the transaction will go through.</p>
                <p>You will be notified in case it fails.</p>
                <Btn class="mt-6" @click="cancelBuy">Close</Btn>
            </div>
        </div>
        <div v-else-if="transaction._error" class="overlay">
            <div class="bg-grad-lightest shadow-md rounded p-8 text-center">
                <h4>An error occured</h4>
                <p class="mt-4 mb-2 text-justify bg-grad-lighter rounded-sm p-2 text-sm font-mono">{{ transaction._error }}</p>
                <Btn class="mt-4" @click="cancelBuy">Close</Btn>
            </div>
        </div>
        <div v-else-if="transaction._fetch" class="overlay">
            <div class="bg-grad-lightest shadow-md rounded p-8 text-center">
                <h4>Waiting for wallet confirmation</h4>
                <p class="text-center mt-6"><i class="far fa-spinner animate-spin-slow text-xl"/></p>
            </div>
        </div>
    </div>
</template>
