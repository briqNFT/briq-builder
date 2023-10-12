<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { readableNumber, readableUnit } from '@/BigNumberForHumans';
import { userBalance } from '@/builder/UserBalance';
import { Fetchable } from '@/DataFetching';

import { briqFactory } from './BuyBriqSim';
import contractStore from '@/chain/Contracts';
import Toggle from './generic/Toggle.vue';
import { ExplorerTxUrl } from '@/chain/Explorer';
import { chainBriqs } from '@/builder/ChainBriqs';
import MenuLike from './generic/MenuLike.vue';
import Tooltip from './generic/Tooltip.vue';
import { APP_ENV } from '@/Meta';
import { getSetMarketplaceUrl } from '@/chain/Marketplaces';
import { backendManager } from '@/Backend';
import { maybeStore } from '@/chain/WalletLoading';


const props = defineProps<{
    minimum: number,
}>();

const minimum = computed(() => Math.max(10, props.minimum || 0));

const briqs_wanted = ref(minimum.value);

const parameters = ref(new Fetchable<unknown>());
const slippage = ref(10); // as a per-mille.

const EthUsdPrice = reactive(new Fetchable());

const toggledDetails = ref(false);

const termsSale = ref(false);
const termsBriq = ref(false);
const insideEU = ref(false);
const euCountry = ref('');

onMounted(async () => {
    // Update our understanding of USD/ETH
    EthUsdPrice.fetch(
        async () => 1 / +(await (await fetch('https://api.coinbase.com/v2/exchange-rates?currency=USD')).json())?.data?.rates?.ETH,
    )
    fetchPrices();
})

const fetchPrices = async () => {
    if (parameters.value._error)
        parameters.value.clear();
    parameters.value.fetch(async () => {
        if (APP_ENV === 'prod')
            briqFactory.setParams('2201831629382202264696000', '0');
        else {
            const params = await contractStore.briq_factory!.getParameters();
            briqFactory.setParams(params.current_t, params.surge_t);
        }
        return {};
    });
}

const get_price_eth = (briqs: number) => {
    let price = BigInt(briqFactory.getPrice(briqs));
    let slippage_value = price * BigInt(slippage.value) / 1000n;
    return price + slippage_value;
}

const surgePart = computed(() => {
    return BigInt(briqFactory.getSurgePrice(briqs_wanted.value));
})

const regularPart = computed(() => {
    return get_price_eth(briqs_wanted.value) - surgePart.value;
})

const impactOnPrice = computed(() => {
    let price = get_price_eth(1);
    let delta = BigInt(briqFactory.getPriceAfter(briqs_wanted.value)).sub(price);
    if (delta.cmp(BigInt('100000000000000')) < 0)
        return 0n;
    return delta;
})

const shareOfSurge = computed(() => {
    const price = get_price_eth(briqs_wanted.value);
    if (price == 0n)
        return 0;
    return Number(surgePart.value * 1000n / price) / 10;
})

const as_dollars = computed(() => {
    if (!parameters.value._data)
        return '...';
    let price = +readableNumber(get_price_eth(briqs_wanted.value) * BigInt(EthUsdPrice._data * 10000000000|| 10000000000) / 10000000000n);
    if (price > 1000)
        return '~' + Math.round(price);
    return Math.round(price*100)/100;
})

const price_ber_briq = computed(() => {
    if (briqs_wanted.value == 0)
        return 0n;
    let price = get_price_eth(briqs_wanted.value);
    return (price / BigInt(briqs_wanted.value)).toString();
})

const balance = computed(() => {
    if (!userBalance.current?.balance._data)
        return '';
    return readableNumber(userBalance.current?.balance._data) + '\u00a0' + readableUnit(userBalance.current?.balance._data);
})

const transaction = ref(new Fetchable<string>());
const buyBriqs = async () => {
    transaction.value.clear();
    backendManager.post('v1/user/billing_country', {
        wallet_address: maybeStore.value!.userWalletAddress,
        outside_eu: !insideEU.value,
        eu_country: insideEU.value ? euCountry.value : '',
    });
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
.overlay::before {
    content: ' ';
    @apply z-[-1] absolute top-0 left-0 w-full h-full bg-grad-lighter opacity-50 rounded-md border border-grad-light;
}
.overlay {
    @apply absolute p-2 top-0 left-0 w-full h-full z-20 flex justify-center items-center;
}
</style>

<template>
    <div class="relative">
        <div class="m-auto relative">
            <!--
            <div class="flex justify-between items-center mb-2">
                <div class="flex gap-0 font-medium relative items-center">
                    <p>Buy</p>
                    <Toggle class="w-12 mx-2" v-model="ToggleBuySell"/>
                    <p class="text-grad-dark">Sell</p>
                </div>
                <Btn no-background class=" p-1"><i class="far fa-gear"/></Btn>
            </div>
            -->
            <div class="relative m-auto rounded-md border-grad-lighter border-2">
                <MenuLike :close-on-click="false" :delay="false" position="br" class="flex items-center absolute right-0 top-0 mr-2 mt-2">
                    <template #button="{ open }">
                        <Btn no-background @click.stop="open" class="text-grad-dark relative left-2 bottom-2 rounded-md p-1 mb-1"><i class="far fa-gear"/></Btn>
                    </template>
                    <template #default="{ open }">
                        <div class="p-4 rounded shadow-md bg-grad-lightest border border-grad-lighter" @keydown.enter="open">
                            <p class="leading-normal">
                                Max price slippage:<br>
                                <span class="flex justify-between items-center">
                                    <span><input class="mr-1 w-20" type="number" min="0" v-model="slippage">‰</span>
                                    <Btn :disabled="slippage === 10" @click="slippage = 10" no-background class="ml-2 p-2 h-auto">
                                        <i class="text-sm p-0 fa-solid fa-arrows-rotate"/>
                                    </Btn>
                                </span>
                            </p>
                        </div>
                    </template>
                </MenuLike>
                <div class="p-6">
                    <p class="flex flex-1 justify-between items-center gap-4">
                        <span class="text-2xl font-medium" v-if="parameters._data">{{ readableNumber(get_price_eth(briqs_wanted)) }}</span>
                        <span class="text-2xl font-medium" v-else>...</span>
                        <span class="text-2xl font-medium">ETH</span>
                    </p>
                    <p class="flex flex-1 items-center justify-between gap-4 mt-2 text-sm">
                        <span>{{ as_dollars }}$</span>
                        <span v-show="!!balance">Balance: {{ balance }}</span>
                    </p>
                </div>
                <div class="relative">
                    <hr class="my-2 rounded border border-grad-lighter">
                    <i class="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] fas fa-arrow-down bg-grad-lightest p-1 border-2 border-grad-lighter rounded"/>
                </div>
                <div class="p-6">
                    <p class="flex flex-1 justify-between items-center gap-4">
                        <input class="text-2xl text-grad-darkest font-medium px-2 py-1 w-full" type="number" :min="minimum" :max="1000000" v-model="briqs_wanted">
                        <span class="text-2xl font-medium">briqs</span>
                    </p>
                </div>
            </div>
        </div>
        <div class="my-4 text-sm flex justify-between items-center gap-8">
            <div>
                <p class="mt-1" v-if="parameters._data">1 briq = {{ readableNumber(price_ber_briq) }} {{ readableUnit(price_ber_briq) }}</p>
                <p class="my-2 flex items-center">
                    <i class="mr-2 far fa-circle-exclamation text-primary"/> <span>Please be aware that the price of briq is currently very high due to demand. You can also get briqs by buying sets from <a class="text-primary" :href="getSetMarketplaceUrl()">Unframed</a> and disassembling them.</span>
                </p>
            </div>
            <i @click.stop.prevent="toggledDetails=!toggledDetails" :class="`p-2 cursor-pointer hover:bg-grad-light rounded fa-solid fa-chevron-${toggledDetails ? 'up' : 'down'}`"/>
        </div>
        <div class="text-sm" v-show="toggledDetails">
            <p>The price shown is the maximum, but you may end up paying less depending on actual slippage.</p>
            <Tooltip tooltip="Surge demand: The price increase due to the current demand surge.">
                <p>Additional cost due to surge demand: {{ readableNumber(surgePart) }} {{ readableUnit(surgePart) }}</p>
            </Tooltip>
            <Tooltip tooltip="Impact price: The price increase due to your purchase of briqs.">
                <p>Impact on price: {{ readableNumber(impactOnPrice) }} {{ readableUnit(impactOnPrice) }}</p>
            </Tooltip>
        </div>
        <div v-show="shareOfSurge > 10" class="my-4 bg-grad-lightest border-2 border-info-error rounded p-4">
            <p>Warning: prices are exceptionally high because of unexpected demand.<br>Come back in a few hours for lower prices.</p>
            <p>Surge amount: {{ readableNumber(surgePart) }} {{ readableUnit(surgePart) }} ({{ shareOfSurge }}%)</p>
        </div>
        <div class="text-sm flex flex-col gap-1 my-4">
            <hr class="mb-4 rounded border border-grad-lighter">
            <p class="flex items-center gap-1"><Toggle v-model="termsBriq" class="w-10 mr-2"/>I agree to the <RouterLink class="text-primary" :to="{ name: 'Legal Doc', params: { doc: '2022-09-23-terms-conditions' } }">briq terms of use</RouterLink></p>
            <p class="flex items-center gap-1"><Toggle v-model="termsSale" class="w-10 mr-2"/>I agree to the <RouterLink class="text-primary" :to="{ name: 'Legal Doc', params: { doc: '2022-08-16-terms-of-sale' } }">NFT sale terms</RouterLink></p>
            <p class="leading-normal">Are you a European Union resident?<br/><span class="inline-flex items-center">No <Toggle v-model="insideEU" class="w-10 mx-1 my-1"/>Yes</span>
                <span v-show="insideEU" class="ml-2"><select class="py-1" v-model="euCountry">
                    <option value="austria">Austria</option>
                    <option value="belgium">Belgium</option>
                    <option value="bulgaria">Bulgaria</option>
                    <option value="cyprus">Cyprus</option>
                    <option value="czech_republic">Czech Republic</option>
                    <option value="croatia">Croatia</option>
                    <option value="denmark">Denmark</option>
                    <option value="estonia">Estonia</option>
                    <option value="finland">Finland</option>
                    <option value="france">France</option>
                    <option value="germany">Germany</option>
                    <option value="greece">Greece</option>
                    <option value="hungary">Hungary</option>
                    <option value="ireland">Ireland</option>
                    <option value="italy">Italy</option>
                    <option value="latvia">Latvia</option>
                    <option value="lithuania">Lithuania</option>
                    <option value="luxembourg">Luxembourg</option>
                    <option value="malta">Malta</option>
                    <option value="netherlands">Netherlands</option>
                    <option value="poland">Poland</option>
                    <option value="portugal">Portugal</option>
                    <option value="romania">Romania</option>
                    <option value="slovakia">Slovakia</option>
                    <option value="slovenia">Slovenia</option>
                    <option value="spain">Spain</option>
                    <option value="sweden">Sweden</option>
                    </select>
                </span>
            </p>
        </div>
        <!-- Slotted to allow the export flow to do different things -->
        <slot name="button" :disabled="!termsSale || !termsBriq || !parameters._data" :data="{ briqs: briqs_wanted, price: get_price_eth(briqs_wanted) }">
            <Btn class="w-full" :disabled="!termsSale || !termsBriq || !parameters._data || (insideEU && !euCountry)" @click="buyBriqs">Buy</Btn>
        </slot>
        <div v-if="transaction._data" class="overlay">
            <div class="bg-grad-lightest shadow-md rounded p-8 relative">
                <Btn no-background @click="cancelBuy" class="text-center absolute top-1 right-1 h-6 w-6 p-2"><i class="far fa-xmark"/></Btn>
                <h4 class="text-center">Transaction submitted</h4>
                <p class="mt-2 text-primary text-sm text-center"><a :href="ExplorerTxUrl(transaction._data)" target="_blank">View on Starkscan</a></p>
                <p class="mt-4 mb-2">Your transaction will be confirmed on the blockchain shortly. Your balance has already been updated with <b>{{ briqs_wanted }}</b> additional briqs.</p>
                <p>You can now go on the builder and create something!</p>
                <div class="flex justify-between mt-6">
                    <Btn secondary @click="cancelBuy">Close</Btn>
                    <routerLink to="/builder"><Btn @click="cancelBuy">Create</Btn></routerlink>
                </div>
            </div>
        </div>
        <div v-else-if="transaction._error" class="overlay" @click="cancelBuy">
            <div class="bg-grad-lightest shadow-md rounded p-8 text-center relative">
                <Btn no-background @click="cancelBuy" class="absolute top-1 right-1 h-6 w-6 p-2"><i class="far fa-xmark"/></Btn>
                <h4>An error occured</h4>
                <p class="mt-4 mb-2 text-justify bg-grad-lighter rounded-sm p-2 text-sm font-mono">
                    {{ transaction._error }}
                </p>
                <Btn class="mt-4" @click="cancelBuy">Close</Btn>
            </div>
        </div>
        <div v-else-if="transaction._fetch" class="overlay" @click="cancelBuy">
            <div class="bg-grad-lightest shadow-md rounded p-8 text-center relative">
                <h4>Waiting for wallet confirmation</h4>
                <p class="text-center mt-6"><i class="far fa-spinner animate-spin-slow text-xl"/></p>
            </div>
        </div>
        <!-- Error overlay on top of everything -->
        <div v-if="parameters._error" class="overlay">
            <div class="bg-grad-lightest shadow-md rounded p-8 text-center border-4 border-info-error relative">
                <Btn no-background @click="fetchPrices" class="absolute top-1 right-1 h-6 w-6 p-2"><i class="far fa-xmark"/></Btn>
                <h4>Error fetching prices</h4>
                <p>There was an error fetch briq prices.</p>
                <p v-if="APP_ENV !== 'prod'">{{ parameters._error }}</p>
                <Btn class="mt-6" @click="fetchPrices">Retry</Btn>
            </div>
        </div>
    </div>
</template>
