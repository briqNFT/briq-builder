<template>
    <div class="container m-auto p-4 alternate-buttons">
        <h1 class="text-center">briq debug page</h1>
        <div>
            <p class="!text-xl !font-semibold py-8">
                This page will help you debug potential problems with briqs.<br>
                Keep in mind that StarkNet is currently in Alpha and rather slow.<br>
                Transactions on TestNet can take several minutes, and on mainnet several hours.
            </p>
        </div>
        <div class="my-4">
            <h2>General info:</h2>
            <p>
                Starknet Gateway: {{ gateway }}<br>
                Gateway is reachable:
                <span v-if="reachabilityTest === undefined"><i class="fas fa-spinner animate-spin-slow"/></span>
                <span v-if="reachabilityTest === false"><i class="fas fa-xmark text-red-900"/><br>Error:
                    <span class="font-mono">{{ reachabilityTestData }}</span></span>
                <span v-if="reachabilityTest === true"><i class="fas fa-check text-green-900"/><br></span>
            </p>
            <p>Address: {{ this.addr ?? 'No address' }}</p>
            <p>
                Wallet is deployed:
                <span v-if="walletTest === undefined"><i class="fas fa-spinner animate-spin-slow"/></span>
                <span v-if="walletTest === false"><i class="fas fa-xmark text-red-900"/><br>Error:
                    <span class="font-mono">{{ walletTestData }}</span></span>
                <span v-if="walletTest === true"><i class="fas fa-check text-green-900"/><br></span>
            </p>
            <p>
                Minting status:
                <span v-if="mintTest === undefined"><i class="fas fa-spinner animate-spin-slow"/></span>
                <span v-else-if="mintTest === false"><i class="fas fa-xmark text-red-900"/><br>Error:
                    <span class="font-mono">{{ mintTestData }}</span></span>
                <span v-else-if="mintTest === true && +mintTestData > 0"><i class="fas fa-check text-green-900"/> minted</span>
                <span v-else-if="mintTest === true"><i class="far fa-circle text-blue-900"/> not minted yet</span>
            </p>
            <p>
                briq balance:
                <span v-if="briqsTest === undefined"><i class="fas fa-spinner animate-spin-slow"/></span>
                <span v-if="briqsTest === false"><i class="fas fa-xmark text-red-900"/><br>Error:
                    <span class="font-mono">{{ briqsTestData }}</span></span>
                <span v-if="briqsTest === true"><i class="fas fa-check text-green-900"/> {{ briqsTestData }} briqs</span>
            </p>
            <p>
                Set balance:
                <span v-if="setsTest === undefined"><i class="fas fa-spinner animate-spin-slow"/></span>
                <span v-if="setsTest === false"><i class="fas fa-xmark text-red-900"/><br>Error:
                    <span class="font-mono">{{ setsTestData }}</span></span>
                <span v-if="setsTest === true"><i class="fas fa-check text-green-900"/> {{ setsTestData }} set(s)</span>
            </p>
        </div>
        <div class="my-4">
            <h2>Custom Read Call:</h2>
            <p>
                <select v-model="cc_contract">
                    <option value="set">set</option>
                    <option value="briq">briq</option>
                </select>
            </p>
            <p>Function: <input type="text" v-model="selector"></p>
            <p>Calldata (csv): <input type="text" v-model="calldata"></p>
            <p>
                <Btn :disabled="cc_pending" @click="customCall">Call</Btn><i v-if="cc_pending" class="fas fa-spinner animate-spin"/>
            </p>
            <p v-if="customResult">Result: {{ JSON.stringify(customResult) }}</p>
        </div>
        <div class="my-4">
            <h2>Transaction debug:</h2>
            <input v-model="tempTx" type="text" size="80">
            <Btn :disabled="!tempTx.match(/^0x[a-fA-F0-9]{63}$/gi)" @click="addTx(tempTx)">See Tx info</Btn>
            <p class="!text-sm" v-for="tx in transactionsToDebug">
                - {{ tx }}
                <span v-if="getTxData(tx) === undefined">: <i class="fas fa-spinner animate-spin-slow"/></span>
                <span v-else="">:<br>
                    <span class="px-4 block">
                        <span>Status: {{ getTxData(tx).status }}</span><br>
                        <span>CallData: {{ getTxData(tx)?.transaction?.calldata?.join(', ') }}</span><br>
                        <span v-if="getTxData(tx)?.transaction_failure_reason?.error_message">Error: {{ getTxData(tx)?.transaction_failure_reason?.error_message }}</span>
                    </span>
                </span>
            </p>
        </div>
    </div>
</template>

<style scoped>
p {
    @apply my-2 text-lg font-medium;
}
</style>

<script lang="ts">
import type { Provider } from 'starknet';

import contractStore from '@/chain/Contracts';

import { ticketing, ignoreOutdated, OutdatedPromiseError } from '../../Async';

import * as starknet from 'starknet';
import { hash as snHash } from 'starknet';

import { getProvider } from '@/chain/BlockchainProvider';
import { getCurrentNetwork } from '@/chain/Network';
import { walletStore } from '@/chain/Wallet';

async function test(testVar: string, testDataVar: string, test: CallableFunction) {
    this[testVar] = undefined;
    try {
        await test();
    } catch (err: any) {
        this[testVar] = false;
        this[testDataVar] = err?.toString() ?? err;
    }
}

const callContract = function (provider: Provider, address: string, entryPoint: string, data: any[]) {
    if (!provider.getTransactionTrace)
        return provider.callContract({
            contract_address: address,
            entry_point_selector: snHash.getSelectorFromName(entryPoint),
            calldata: data,
        });
    return provider.callContract({
        contractAddress: address,
        calldata: data,
        entrypoint: entryPoint,
    });
};

import { defineComponent, watchEffect, watchPostEffect, toRef } from 'vue';
export default defineComponent({
    data() {
        return {
            briqContract: toRef(contractStore, 'briq'),
            setContract: toRef(contractStore, 'set'),
            mintContract: toRef(contractStore, 'mint'),

            tempTx: '',

            cc_contract: 'set',
            selector: '',
            calldata: '',
            customResult: '',
            cc_pending: false,

            reachabilityTest: undefined as undefined | boolean,
            reachabilityTestData: '',
            walletTest: undefined as undefined | boolean,
            walletTestData: '',

            mintTest: undefined as undefined | boolean,
            mintTestData: '',

            briqsTest: undefined as undefined | boolean,
            briqsTestData: '',

            setsTest: undefined as undefined | boolean,
            setsTestData: '',

            transactionsToDebug: [] as Array<string>,
            txData: {} as { [key: string]: any },
        };
    },
    computed: {
        wallet() {
            return walletStore;
        },
        addr() {
            if (this.$route.params.address)
                return this.$route.params.address;
            else
                return walletStore.userWalletAddress;
        },
        provider() {
            getCurrentNetwork();
            return getProvider();
        },
        gateway() {
            return getCurrentNetwork();
        },
    },
    mounted() {
        watchEffect(() => {
            this.checkGateway();
        });
        watchEffect(() => {
            this.checkWallet();
        });
        watchEffect(() => {
            this.checkMint();
        });
        watchEffect(() => {
            this.checkBalance();
            this.checkBalanceSets();
        });
    },
    methods: {
        async customCall() {
            this.cc_pending = true;
            try {
                this.customResult = '';
                let tx = await callContract(
                    getProvider(),
                    (this.cc_contract === 'set' ? contractStore.set : contractStore.briq).getAddress(),
                    this.selector,
                    this.calldata
                        .split(',')
                        .filter((x) => x)
                        .map((x: string) => starknet.number.toBN(x.trim()).toString()),
                );
                this.customResult = tx;
            } catch (err) {
                this.customResult = err.toString();
            }
            this.cc_pending = false;
        },

        addTx(tx: string) {
            if (this.transactionsToDebug.indexOf(tx) === -1)
                this.transactionsToDebug.splice(0, 0, tx);
        },
        getAddresses: ticketing(async function () {
            return await this.provider.getContractAddresses();
        }),
        checkGateway() {
            test.call(this, 'reachabilityTest', 'reachabilityTestData', async () => {
                try {
                    let addresses = (await this.getAddresses()).Starknet;
                    this.reachabilityTest = true;
                } catch (_) {}
            });
        },
        getCode: ticketing(async function (addr: string) {
            return await this.provider.getCode(addr);
        }),
        async checkWallet() {
            this.walletTest = undefined;
            if (!this.provider || !this.addr)
                return;
            try {
                await ignoreOutdated(async () => {
                    let code = await this.getCode(this.addr);
                    if (!code.bytecode?.length)
                        throw new Error('Wallet is not deployed');
                    this.walletTest = true;
                });
            } catch (err: any) {
                this.walletTest = false;
                this.walletTestData = err?.toString() ?? err;
            }
        },
        getMint: ticketing(async function () {
            return await callContract(this.provider, this.mintContract.getAddress(), 'amountMinted', [
                starknet.number.toBN(this.addr.substr(2), 'hex').toString(),
            ]);
        }),
        checkMint() {
            test.call(this, 'mintTest', 'mintTestData', async () => {
                if (!this.provider || !this.mintContract)
                    return;

                await ignoreOutdated(async () => {
                    let code = await this.getMint();
                    this.mintTest = true;
                    this.mintTestData = '' + parseInt(code.result[0], 16);
                });
            });
        },
        getBalance: ticketing(async function () {
            return await callContract(this.provider, this.briqContract!.getAddress(), 'balanceOf', [
                starknet.number.toBN(this.addr.substr(2), 'hex').toString(),
                '1',
            ]);
        }),
        checkBalance() {
            test.call(this, 'briqsTest', 'briqsTestData', async () => {
                if (!this.provider || !this.briqContract)
                    return;

                ignoreOutdated(async () => {
                    let code = await this.getBalance();
                    this.briqsTest = true;
                    this.briqsTestData = '' + parseInt(code.result[0], 16);
                });
            });
        },
        getSets: ticketing(async function () {
            return await callContract(this.provider, this.setContract!.getAddress(), 'balanceOf_', [
                starknet.number.toBN(this.addr.substr(2), 'hex').toString(),
            ]);
        }),
        checkBalanceSets() {
            test.call(this, 'setsTest', 'setsTestData', async () => {
                if (!this.provider || !this.setContract)
                    return;

                ignoreOutdated(async () => {
                    let code = await this.getSets();
                    this.setsTest = true;
                    this.setsTestData = '' + parseInt(code.result[0], 16);
                });
            });
        },

        async updateTxData(tx: string) {
            try {
                let res = await this.provider.getTransaction(tx);
                this.txData[tx] = res;
            } catch (err: any) {
                this.txData[tx] = {
                    status: 'ERROR',
                    transaction_failure_reason: {
                        error_message:
                            'Error fetching transaction data. Attempting to reload. Details: ' +
                            (err?.toString() ?? '(unknown)'),
                    },
                };
                setTimeout(() => this.updateTxData(tx), 2000);
            }
        },
        getTxData(tx: string) {
            if (!this.txData[tx]) {
                this.updateTxData(tx);
                return undefined;
            }
            return this.txData[tx];
        },
    },
});
</script>
