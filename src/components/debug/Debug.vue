<template>
    <div class="container m-auto p-4 alternate-buttons">
        <h1 class="text-center">briq debug page</h1>
        <div>
            <p class="!text-xl !font-semibold py-8">
            This page will help you debug potential problems with Briqs.<br/>
            Keep in mind that StarkNet is currently in Alpha and rather slow.<br />
            Transactions on TestNet can take several minutes, and on mainnet several hours.
            </p>
        </div>
        <div class="my-4">
            <h2>General info:</h2>
            <p>Starknet Gateway: {{ gateway }}<br/>
            Gateway is reachable:
                <span v-if="reachabilityTest === undefined"><i class="fas fa-spinner animate-spin-slow"></i></span>
                <span v-if="reachabilityTest === false"><i class="fas fa-times text-red-900"></i><br/>Error: <span class="font-mono">{{ reachabilityTestData }}</span></span>
                <span v-if="reachabilityTest === true"><i class="fas fa-check text-green-900"></i><br/></span>
            </p>
            <p>Address: {{ this.addr ?? "No address" }}</p>
            <p>Wallet is deployed:
                <span v-if="walletTest === undefined"><i class="fas fa-spinner animate-spin-slow"></i></span>
                <span v-if="walletTest === false"><i class="fas fa-times text-red-900"></i><br/>Error: <span class="font-mono">{{ walletTestData }}</span></span>
                <span v-if="walletTest === true"><i class="fas fa-check text-green-900"></i><br/></span>
            </p>
            <p>Minting status:
                <span v-if="mintTest === undefined"><i class="fas fa-spinner animate-spin-slow"></i></span>
                <span v-else-if="mintTest === false"><i class="fas fa-times text-red-900"></i><br/>Error: <span class="font-mono">{{ mintTestData }}</span></span>
                <span v-else-if="mintTest === true && +mintTestData > 0"><i class="fas fa-check text-green-900"></i> minted</span>
                <span v-else-if="mintTest === true"><i class="far fa-circle text-blue-900"></i> not minted yet</span>
            </p>
            <p>Briq balance:
                <span v-if="briqsTest === undefined"><i class="fas fa-spinner animate-spin-slow"></i></span>
                <span v-if="briqsTest === false"><i class="fas fa-times text-red-900"></i><br/>Error: <span class="font-mono">{{ briqsTestData }}</span></span>
                <span v-if="briqsTest === true"><i class="fas fa-check text-green-900"></i> {{ briqsTestData }} briqs</span>
            </p>
            <p>Set balance:
                <span v-if="setsTest === undefined"><i class="fas fa-spinner animate-spin-slow"></i></span>
                <span v-if="setsTest === false"><i class="fas fa-times text-red-900"></i><br/>Error: <span class="font-mono">{{ setsTestData }}</span></span>
                <span v-if="setsTest === true"><i class="fas fa-check text-green-900"></i> {{ setsTestData }} set(s)</span>
            </p>
        </div>
        <div class="my-4">
            <h2>Transaction debug:</h2>
            <input v-model="tempTx" type="text" size="80"/> <Button :disabled="!tempTx.match(/^0x[a-fA-F0-9]{63}$/gi)" @click="addTx(tempTx)">See Tx info</Button>
            <p class="!text-sm" v-for="tx in transactionsToDebug">- {{ tx }}
                <span v-if="getTxData(tx) === undefined">: <i class="fas fa-spinner animate-spin-slow"></i></span>
                <span v-else="">:<br/>
                    <span class="px-4 block">
                        <span>Status: {{ getTxData(tx).status }}</span><br/>
                        <span>CallData: {{ getTxData(tx)?.transaction?.calldata?.join(", ") }}</span><br/>
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
import type { Provider, CallContractTransaction } from 'starknet';

import { transactionsManager } from '../../builder/Transactions';
import contractStore from '../../Contracts';

import { toBN } from 'starknet/utils/number';
import { getSelectorFromName } from 'starknet/utils/stark';
//import {  } from './utils/stark';

import { defineComponent, watchEffect, toRef} from 'vue';
import { starknetKeccak } from 'starknet/dist/utils/hash';
export default defineComponent({
    data() {
        return {
            wallet: this.$store.state.wallet,
            provider: (toRef(this.$store.state.wallet, "provider") as Provider),
            addr: this.getAddr(),
            
            briqContract: toRef(contractStore, "briq"),
            setContract: toRef(contractStore, "set"),
            mintContract: toRef(contractStore, "mint"),

            tempTx: "",

            reachabilityTest: undefined as undefined | boolean,
            reachabilityTestData: "",
            walletTest: undefined as undefined | boolean,
            walletTestData: "",

            mintTest: undefined as undefined | boolean,
            mintTestData: "",

            briqsTest: undefined as undefined | boolean,
            briqsTestData: "",

            setsTest: undefined as undefined | boolean,
            setsTestData: "",

            transactionsToDebug: [] as Array<string>,
            txData: {} as { [key: string]: any}
        }
    },
    computed: {
        mainnet() {
            return (this.provider?.gatewayUrl?.search("mainnet") ?? -1) !== -1;
        },
        gateway() {
            if (this.mainnet)
                return "Alpha Main-net";
            return "Alpha Testnet"
        }
    },
    mounted() {
        /*watch(toRef(this.wallet, "userWalletAddress"), () => {
            this.update();
        });
        this.update();*/
        if (!this.wallet.signer)
            this.$store.dispatch("wallet/enable_wallet");
        watchEffect(() => {
            this.update();
        });
        watchEffect(() => {
            for (let tx of transactionsManager.transactions)
                this.addTx(tx.hash)
        })
    },
    methods: {
        getAddr() {
            if (this.$route.params.address)
                return this.$route.params.address;
            else
                return toRef(this.$store.state.wallet, "userWalletAddress");
        },
        addTx(tx: string) {
            if (this.transactionsToDebug.indexOf(tx) === -1)
                this.transactionsToDebug.splice(0, 0, tx);
        },

        update() {
            this.checkGateway();
            this.checkWallet();
            this.checkMint();
            this.checkBalance();
            this.checkBalanceSets();
        },
        async checkGateway() {
            this.reachabilityTest = undefined;
            if (!this.provider)
                return;
            try {
                let addresses = (await this.provider.getContractAddresses()).Starknet;
                this.reachabilityTest = true;
            } catch(err: any)
            {
                this.reachabilityTest = false;
                this.reachabilityTestData = err?.toString() ?? err;
            }
        },
        async checkWallet()
        {
            this.walletTest = undefined;
            if (!this.provider || !this.addr)
                return;
            try {
                let code = await this.provider.getCode(this.addr);
                if (!code.bytecode.length)
                    throw new Error("Wallet is not deployed");
                this.walletTest = true;
            } catch(err: any)
            {
                this.walletTest = false;
                this.walletTestData = err?.toString() ?? err;
            }
        },
        async checkMint()
        {
            this.mintTest = undefined;
            if (!this.provider || !this.mintContract)
                return;
            try {
                let code = await this.provider.callContract({
                    contract_address: this.mintContract.connectedTo,
                    entry_point_selector: getSelectorFromName("has_minted"),
                    calldata: [toBN(this.addr.substr(2,), "hex").toString()],
                });
                this.mintTest = true;
                this.mintTestData = "" + parseInt(code.result[0], 16);
            } catch(err: any)
            {
                this.mintTest = false;
                this.mintTestData = err?.toString() ?? err;
            }
        },
        async checkBalance()
        {
            this.briqsTest = undefined;
            if (!this.provider || !this.briqContract)
                return;
            try {
                let code = await this.provider.callContract({
                    contract_address: this.briqContract.connectedTo,
                    entry_point_selector: getSelectorFromName("balance_of"),
                    calldata: [toBN(this.addr.substr(2,), "hex").toString()],
                });
                this.briqsTest = true;
                this.briqsTestData = "" + parseInt(code.result[0], 16);
            } catch(err: any)
            {
                this.briqsTest = false;
                this.briqsTestData = err?.toString() ?? err;
            }
        },
        async checkBalanceSets()
        {
            this.briqsTest = undefined;
            if (!this.provider || !this.setContract)
                return;
            try {
                let code = await this.provider.callContract({
                    contract_address: this.setContract.connectedTo,
                    entry_point_selector: getSelectorFromName("balance_of"),
                    calldata: [toBN(this.addr.substr(2,), "hex").toString()],
                });
                this.setsTest = true;
                this.setsTestData = parseInt(code.result[0], 16)
            } catch(err: any)
            {
                this.setsTest = false;
                this.setsTestData = err?.toString() ?? err;
            }
        },

        async updateTxData(tx: string)
        {
            try {
                let res = await this.provider.getTransaction(tx);
                this.txData[tx] = res;
            }
            catch(err: any)
            {
                this.txData[tx] = {
                    status: "ERROR",
                    transaction_failure_reason: {
                        error_message: "Error fetching transaction data. Attempting to reload. Details: " + (err?.toString() ?? "(unknown)")
                    }
                };
                setTimeout(() =>this.updateTxData(tx), 2000);
            }
        },
        getTxData(tx: string)
        {
            if (!this.txData[tx])
            {
                this.updateTxData(tx);
                return undefined;
            }
            return this.txData[tx];
        }
    }
})
</script>