<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import * as starknet from 'starknet';
import { readableNumber, readableUnit } from '@/BigNumberForHumans';
import { userBalance } from '@/builder/UserBalance';
import { Fetchable } from '@/DataFetching';

const briqs_wanted = ref(300);

const get_price_eth = (briqs: number) => {
    return starknet.number.toBN('100000000000000').mul(starknet.number.toBN(briqs));
}

const as_dollars = computed(() => {
    let price = get_price_eth(briqs_wanted.value).mul(
        starknet.number.toBN(EthUsdPrice._data * 10000000000|| 10000000000),
    ).div(starknet.number.toBN(10000000000));
    price = +readableNumber(price);
    if (price > 1000)
        return '~' + Math.round(price);
    return Math.round(price*100)/100;
})

const EthUsdPrice = reactive(new Fetchable());
EthUsdPrice.fetch(
    async () => 1 / +(await (await fetch('https://api.coinbase.com/v2/exchange-rates?currency=USD')).json())?.data?.rates?.ETH,
)

const slippage = ref(2);

const max_post_slip_price = computed(() => {
    let price = get_price_eth(briqs_wanted.value);
    let slippage_value = price.mul(starknet.number.toBN(slippage.value)).div(starknet.number.toBN(1000));
    return price.add(slippage_value);
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

</script>

<template>
    <div class="bg-grad-lighter rounded-md p-6">
        <div class="w-[24rem] m-auto">
            <div class="bg-grad-lightest rounded-md p-6">
                <p class="flex flex-1 justify-between gap-4">
                    <span class="text-max font-medium">{{ readableNumber(get_price_eth(briqs_wanted)) }}</span>
                    <span class="text-max font-medium">ETH</span>
                </p>
                <p class="flex flex-1 items-center justify-between gap-4 mt-2 text-sm">
                    <span>{{ as_dollars }}$</span>
                    <span v-show="!!balance">Balance: {{ balance }}</span>
                </p>
            </div>
            <p class="text-center">into</p>
            <div class="bg-grad-lightest rounded-md p-6">
                <p class="flex flex-1 justify-between gap-4">
                    <input class="text-max font-medium px-2 py-1 w-full" type="text" v-model="briqs_wanted">
                    <span class="text-max font-medium">briqs</span>
                </p>
            </div>
        </div>
        <div class="my-4 text-sm flex justify-between items-center gap-8">
            <div>
                <p>You will pay a maximum of {{ readableNumber(max_post_slip_price) }} {{ readableUnit(max_post_slip_price) }} for {{ +briqs_wanted || 0 }} briqs</p>
                <p>1 briq = {{ readableNumber(price_ber_briq) }} {{ readableUnit(price_ber_briq) }} </p>
            </div>
            <i class="fa-solid fa-chevron-down"/>
        </div>
        <Btn class="w-full">Buy</Btn>
    </div>
</template>
