<script setup lang="ts">
import { computed, ref } from 'vue';
import * as starknet from 'starknet';
import { readableNumber } from '@/BigNumberForHumans';

const briqs_wanted = ref(300);

const get_price_eth = (briqs: number) => {
    // 0.001 ETH
    return starknet.number.toBN('1000000000000000').mul(starknet.number.toBN(briqs));
}

const as_dollars = computed(() => {
    // 1 eth = 1000$
    return get_price_eth(briqs_wanted.value).mul(starknet.number.toBN('1000'));
})
//curl https://api.coinbase.com/v2/exchange-rates?currency=BTC

</script>

<template>
    <div class="bg-grad-lighter rounded-md p-6">
        <div class="bg-grad-lightest rounded-md p-6">
            <p class="flex flex-1 justify-between gap-4">
                <span class="text-xl font-medium">{{ readableNumber(get_price_eth(briqs_wanted)) }}</span>
                <span class="text-xl font-medium">ETH</span>
            </p>
            <p class="flex flex-1 items-center justify-between gap-4 mt-2 text-sm">
                <span>{{ readableNumber(as_dollars) }}$</span>
                <span>Balance: 1ETH</span>
            </p>
        </div>
        <p class="text-center">into</p>
        <div class="bg-grad-lightest rounded-md p-6">
            <p class="flex flex-1 justify-between gap-4">
                <input class="text-xl font-medium px-2 py-1 w-full" type="text" v-model="briqs_wanted">
                <span class="text-xl font-medium">briqs</span>
            </p>
        </div>
        <div class="my-4 text-sm flex justify-between items-center">
            <div>
                <p>You will pay a maximum of 3.03 USDC for 300 briqs</p>
                <p>1 briq = 0.01 USDC</p>
            </div>
            <i class="fa-solid fa-chevron-down"/>
        </div>
        <Btn class="w-full">Buy</Btn>
    </div>
</template>