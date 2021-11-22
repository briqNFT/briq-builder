<template>
    <div v-if="open" id="walletSelector">
        <template v-if="step=='selection'">
            <h2>Choose your wallet</h2>
            <div class="walletOptions">
                <button v-for="wallet, key in availableWallets" @click="chooseWallet(key)">{{ wallet.name }}</button>
            </div>
        </template>
        <template v-else-if="step=='manual-1'">
            <h2>Enter wallet information</h2>
            <p>NB: the private key will remain in browser, but this remains rather unsafe.</p>
            <p>Wallet Contract Address:<input v-model="walletContractAddress" type="text"/></p>
            <p>Wallet Private Key:<input v-model="walletPrivateKey" type="password"/></p>
            <button @click="initManual">Connect</button>
        </template>
        <template v-else-if="step=='success'">
            <h2>Success</h2>
            <p>You have successfully connected your wallet.</p>
            <p>Your address is <span style="word-break: break-all;">{{ contractStore.userWalletAddress }}</span></p>
            <p>Closing in {{ countdown }}</p>
        </template>
        <template v-else-if="step=='error'">
            <h2>Error</h2>
            <p>There was an error connecting your wallet:</p>
            <p>{{ error }}</p>
            <button @click="step='selection'">Go back</button>
        </template>
        <button class="close absolute bottom-4 right-4" @click="step='selection'; open = !open">Close Window</button>
    </div>
</template>

<script lang="ts">
import { getSelectorFromName } from 'starknet/utils/stark';
import { toBN } from 'starknet/utils/number';
import { getKeyPair } from 'starknet/utils/ellipticCurve';
import { Signer } from 'starknet';

import { getPotentialWallets } from '../Wallet'

import { ref } from 'vue'
export var openSelector = ref(false);

import { defineComponent } from 'vue';
import { IWallet } from '../wallets/IWallet';
export default defineComponent({
    data() {
        return {
            contractStore: this.$store.state.wallet,
            open: openSelector,
            step: 'selection',
            error: '',
            availableWallets: getPotentialWallets(),
            countdown: 0,
            // Manual stuff
            walletContractAddress: "0x029aaa6c4abb3d009a138aad90cceb51ab2c18ac76c2e874d019caf6eafdc485",
            walletPrivateKey: "12345",
        }
    },
    methods: {
        chooseWallet: async function(walletId: any) {
            // Shouldn't happen in the regular interface happy path, just return
            if (!this.availableWallets[walletId])
                return;
            let wallet: IWallet = new this.availableWallets[walletId].handler();
            try
            {
                await wallet.enable(this.$store);
                if (this.contractStore.isConnected)
                    this.step = "success";
                else
                    throw new Error("Could not connect to Argent-X wallet with address " + this.contractStore.userWalletAddress);
            }
            catch(err: any)
            {
                this.error = wallet.getErrorMessage(err);
                this.step = "error";
            }
        },
        initManual: async function() {
            contractStore.isConnected = true;
            contractStore.userWalletAddress = this.walletContractAddress;
            contractStore.signer = new Signer(contractStore.provider, this.walletContractAddress, getKeyPair(toBN(this.walletPrivateKey).toString()));
            this.open = false;
            const { result } = await contractStore.signer.callContract({
                contract_address: this.walletContractAddress,
                entry_point_selector: getSelectorFromName('get_current_nonce'),
            });
            const nonceBn = toBN(result[0]);
            console.log(result, nonceBn);
            console.log(await contractStore.signer.addTransaction({
                type: 'INVOKE_FUNCTION',
                entry_point_selector: getSelectorFromName('mint_multiple'),
                calldata: ["0", "1", "0", "0"],
                contract_address: "0x04a0ed17b7453e304261df18633bdb7fd8c8275f42f254e9f4674e85736c65ae",
            }));
        },
    },
    watch: {
        step: function(nv, ov) {
            if (nv === "success")
            {
                this.countdown = 4;
                let cd = () => {
                    this.countdown--;
                    if (this.countdown === 0)
                        this.open = false;
                    else
                        setTimeout(cd, 1000);
                };
                setTimeout(cd, 1000);
            }
        }
    }
})
</script>

<style scoped>
h2 {
    @apply text-center my-4;
}

button {
    @apply btn;
}

#walletSelector {
    @apply bg-briq-light p-2 rounded-xl shadow-xl;

    position:fixed;
    width: 400px;
    height: 400px;
    top: calc(50% - 200px);
    left: calc(50% - 200px);
    z-index: 1000;
}

.walletOptions {
    display: flex;
    justify-content: center;
}
.walletOptions button {
    height: 5rem;
    width: 5rem;
    margin: 0.5rem;
    padding: 0.5rem;
}
</style>