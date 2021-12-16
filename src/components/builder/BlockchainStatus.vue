<script setup lang="ts">
import Button from "../generic/Button.vue";
import Settings from '../builder/modals/Settings.vue';
import TransactionsMin from './TransactionsMin.vue';
import BriqDetails from './BriqDetails.vue';
</script>

<template>
    <div class="flex flex-col items-end">
        <div class="overflow-auto flex flex-nowrap flex-col justify-start content-end">
            <Button class="pointer-events-auto flex items-center gap-2 text-center" @click="mainBtnClick" :tooltip="mainBtnTooltip">
                <div v-if="!isConnected">Connect Wallet</div>
                <div v-else-if="isConnected && builderData.briqContract" class="inline-block text-sm leading-3">{{ userAddress }}<br/>{{ userNet }}</div>
                <div v-else="" class="inline-block text-sm leading-3">Unsupported<br/>Network</div>
                <template v-if="isConnected && builderData.briqContract">
                    <i v-if="transactionsManager.anyPending() || builderData.fetchingBriqs" class="fas fa-spinner animate-spin-slow"></i>
                    <i v-if="!transactionsManager.anyPending() && !builderData.fetchingBriqs && builderData.briqsDB.briqs.size > 0" class="fas fa-check"></i>
                </template>
            </Button>
            <div :class="'my-2 ' + (expanded ? 'pointer-events-auto': 'hidden')">
                <div class="flex flex-col flex-nowrap gap-1">
                    <Button v-if="isConnected" @click="expanded = false; $store.dispatch('wallet/disconnect')">Disconnect</Button>
                </div>
            </div>
        </div>
        <div :class="'relative bg-briq rounded-md ' + (expanded ? 'pointer-events-auto' : 'hidden')">
            <BriqDetails/>
        </div>
        <div :class="'my-2 relative bg-briq rounded-md ' + (expanded ? 'pointer-events-auto' : 'hidden')">
            <TransactionsMin/>
        </div>
    </div>
</template>

<script lang="ts">
import { setModal } from '../MiddleModal.vue';

import WalletSelectorVue from '../WalletSelector.vue';
import { transactionsManager } from '../../builder/Transactions';

import { defineComponent } from "vue";
export default defineComponent({
    data() {
        return {
            expanded: false,
            wallet: this.$store.state.wallet,
            builderData: this.$store.state.builderData,
            transactionsManager
        };
    },
    inject: ["messages"],
    computed: {
        isConnected() {
            return this.wallet.userWalletAddress;
        },
        mainBtnTooltip() {
            if (this.isConnected)
                return "Click here for more details on blockchain status";
            return "Click here to connect your wallet";
        },
        userAddress() {
            return this.wallet.userWalletAddress.substr(0, 5) + '...' + this.wallet.userWalletAddress.substr(-5, 5);
        },
        userNet() {
            return this.wallet.signer.baseUrl.search("mainnet") !== -1 ? 'mainnet' : 'testnet';
        }
    },
    methods: {
        setModal,
        mainBtnClick() {
            if (this.isConnected)
                this.expanded = ! this.expanded;
            else
                setModal(WalletSelectorVue);
        },
    }
})
</script>

<style scoped>
</style>
