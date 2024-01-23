<script setup lang="ts">
import { ref, computed } from 'vue';
import { hexUuid } from '@/Uuid';

const canMasterInit = computed(() => {
    return contractStore.briq?.getAddress() && contractStore.set?.getAddress() && walletStore.userWalletAddress
});

const customPayload = ref('');

const impersonate = ref('');

const setupWorld = async () => {
    const addr = ADDRESSES[getCurrentNetwork()];
    const txes = [
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['WorldConfig', addr.setup_world] },

        { contractAddress: addr.setup_world, entrypoint: 'register_box_contract', calldata:[addr.world, addr.box_nft_sp , 1] },
        { contractAddress: addr.setup_world, entrypoint: 'register_box_contract', calldata:[addr.world, addr.box_nft_briqmas , 1] },

        { contractAddress: addr.setup_world, entrypoint: 'register_set_contract', calldata:[addr.world, addr.set_nft , 1] },
        { contractAddress: addr.setup_world, entrypoint: 'register_set_contract', calldata:[addr.world, addr.set_nft_ducks , 1] },
        { contractAddress: addr.setup_world, entrypoint: 'register_set_contract', calldata:[addr.world, addr.set_nft_sp , 1] },
        { contractAddress: addr.setup_world, entrypoint: 'register_set_contract', calldata:[addr.world, addr.set_nft_briqmas , 1] },
        { contractAddress: addr.setup_world, entrypoint: 'register_set_contract', calldata:[addr.world, addr.set_nft_1155_ducks_frens , 1] },

        { contractAddress: addr.attribute_groups, entrypoint: 'create_attribute_group', calldata: [addr.world, '0x1', 1, addr.booklet_starknet_planet, addr.set_nft_sp] },
        { contractAddress: addr.attribute_groups, entrypoint: 'create_attribute_group', calldata: [addr.world, '0x2', 1, addr.booklet_briqmas, addr.set_nft_briqmas] },
        { contractAddress: addr.attribute_groups, entrypoint: 'create_attribute_group', calldata: [addr.world, '0x3', 1, addr.booklet_ducks, addr.set_nft_ducks] },
        { contractAddress: addr.attribute_groups, entrypoint: 'create_attribute_group', calldata: [addr.world, '0x4', 1, addr.booklet_ducks_frens, addr.set_nft_1155_ducks_frens] },

        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: [shortString.encodeShortString('ShapeValidator'), addr.register_shape_validator] },
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: [shortString.encodeShortString('ShapeValidatorAdmin'), addr.register_shape_validator] },

    // Allow OutSmth to handle duck collections
        { contractAddress: addr.register_shape_validator, entrypoint: 'set_admin', calldata: [addr.world, '0x3', '0x02ef9325a17d3ef302369fd049474bc30bfeb60f59cca149daa0a0b7bcc278f8', 1] },
        { contractAddress: addr.register_shape_validator, entrypoint: 'set_admin', calldata: [addr.world, '0x4', '0x02ef9325a17d3ef302369fd049474bc30bfeb60f59cca149daa0a0b7bcc278f8', 1] },

        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['BriqFactoryStore', addr.briq_factory] },
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC1155OperatorApproval', addr.briq_token] },
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC1155OperatorApproval', addr.box_nft_sp] },
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC1155OperatorApproval', addr.box_nft_briqmas] },
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC1155OperatorApproval', addr.booklet_ducks] },
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC1155OperatorApproval', addr.booklet_starknet_planet] },
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC1155OperatorApproval', addr.booklet_briqmas] },
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC1155OperatorApproval', addr.booklet_ducks_frens] },
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC1155OperatorApproval', addr.set_nft] },
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC1155OperatorApproval', addr.set_nft_ducks] },
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC1155OperatorApproval', addr.set_nft_sp] },
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC1155OperatorApproval', addr.set_nft_briqmas] },
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC1155OperatorApproval', addr.set_nft_1155_ducks_frens] },

        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC1155Balance', addr.briq_token] },
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC1155Balance', addr.box_nft_sp] },
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC1155Balance', addr.box_nft_briqmas] },
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC1155Balance', addr.booklet_ducks] },
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC1155Balance', addr.booklet_starknet_planet] },
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC1155Balance', addr.booklet_briqmas] },
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC1155Balance', addr.booklet_ducks_frens] },
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC1155Balance', addr.set_nft] },
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC1155Balance', addr.set_nft_ducks] },
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC1155Balance', addr.set_nft_sp] },
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC1155Balance', addr.set_nft_briqmas] },
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC1155Balance', addr.set_nft_1155_ducks_frens] },

        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC721Balance', addr.set_nft] },
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC721Balance', addr.set_nft_ducks] },
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC721Balance', addr.set_nft_sp] },
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC721Balance', addr.set_nft_briqmas] },

        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC721Owner', addr.set_nft] },
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC721Owner', addr.set_nft_ducks] },
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC721Owner', addr.set_nft_sp] },
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC721Owner', addr.set_nft_briqmas] },

        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC721OperatorApproval', addr.set_nft] },
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC721OperatorApproval', addr.set_nft_ducks] },
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC721OperatorApproval', addr.set_nft_sp] },
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC721OperatorApproval', addr.set_nft_briqmas] },
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC721TokenApproval', addr.set_nft] },
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC721TokenApproval', addr.set_nft_ducks] },
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC721TokenApproval', addr.set_nft_sp] },
        { contractAddress: addr.world, entrypoint: 'grant_writer', calldata: ['ERC721TokenApproval', addr.set_nft_briqmas] },
    ];
    // console.log(JSON.stringify(txes));
    await (walletStore.signer)?.execute(txes)
}

const customPayloadCall = async () => {
    console.log(JSON.parse(customPayload.value))
    await walletStore.sendTransaction(JSON.parse(customPayload.value));
}

</script>

<template>
    <Header/>
    <div class="alternate-buttons container px-8 py-4 m-auto main">
        <h1 class="text-center">Admin</h1>
        <div class="grid grid-cols-3">
            <div class="col-span-2">
                <div>
                    <h2>Minting</h2>
                    <label><p><input v-model="address" type="text" size="70"> recipient</p></label>
                    <label><p><input v-model="qty" type="number"> quantity</p></label>
                    <label><p>
                        <select v-model="material">
                            <option value="1">Normal</option>
                        </select>
                        Material
                    </p></label>
                    <Btn @click="mint(address, qty, material)">Mint</Btn>
                </div>
                <div class="my-4">
                    <h2>Custom Write Call:</h2>
                    <p>
                        <select v-model="cc_contract">
                            <option value="0x038bf557306ab58c7e2099036b00538b51b37bdad3b8abc31220001fb5139365">Legacy sets</option>
                            <option v-for="value, key in ADDRESSES[getCurrentNetwork()]" :key="key" :value="value">{{ key }}</option>
                        </select>
                    </p>
                    <p>Function: <input type="text" v-model="selector"></p>
                    <p>Calldata (csv): <input type="text" v-model="calldata" size="70"></p>
                    <p>
                        <Btn :disabled="cc_pending" @click="customCall">Call</Btn><i v-if="cc_pending" class="far fa-spinner animate-spin"/>
                    </p>
                    <p v-if="customResult">Result: {{ JSON.stringify(customResult) }}</p>
                </div>
                <div class="my-4">
                    <h2>Totally custom payload</h2>
                    <textarea v-model="customPayload"/>
                    <p>
                        <Btn @click="customPayloadCall">Call</Btn>
                    </p>
                </div>
            </div>
            <div class="border-l-4 border-grad-darker mr-4">
                <div>
                    <h2>Wallet</h2>
                    <p>Current address: {{ wallet.user_id }}</p>
                    <Btn @click="wallet.disconnect(); wallet.openWalletSelector();">Connect Wallet</Btn>
                    <p>Impersonate wallet:<br><input v-model="impersonate" size="64"></p>
                    <Btn @click="wallet.enableExternalWallet(impersonate)" :disabled="!impersonate">Impersonate</Btn>
                </div>
                <div>
                    <h2>Setup</h2>
                    <Btn @click="setupWorld">Setup</Btn>
                </div>
                <div>
                    <h2>Messages</h2>
                    <p class="break-all" v-for="(mess, i) in messages" :key="i">{{ mess }}</p>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
h2 {
    @apply border-t-4 border-grad-darker mb-4;
}
.main > div {
    @apply my-4;
}
</style>

<script lang="ts">
import contractStore, { ADDRESSES } from '@/chain/Contracts';
import { messagesStore, pushMessage } from '../Messages';
import type { AccountInterface, Provider, Signer } from 'starknet';
import { shortString, hash as snHash } from 'starknet';

import { walletStore } from '@/chain/Wallet';

const callContract = function (provider: Provider, address: string, entryPoint: string, data: any[]) {
    /*if (!provider.estimateFee)
        return provider.callContract({
            contract_address: address,
            entry_point_selector: getSelectorFromName(entryPoint),
            calldata: data
        })
    */
    return provider.callContract({
        contractAddress: address,
        calldata: data,
        entrypoint: entryPoint,
    });
};

import { defineComponent } from 'vue';
import { getCurrentNetwork } from '@/chain/Network';
import Header from './landing_page/Header.vue';
export default defineComponent({
    data() {
        return {
            address: '',
            qty: 0,
            material: 1,
            _setImpl: '',
            _briqImpl: '',
            newSetImpl: '',
            newBriqImpl: '',
            cc_contract: '',
            selector: '',
            calldata: '',
            customResult: '',
            cc_pending: false,
        };
    },
    computed: {
        wallet() {
            return walletStore;
        },
        contractStore() {
            return contractStore;
        },
        messages() {
            return messagesStore.messages;
        },
    },
    methods: {
        pushMessage,
        async mint(address: string, qty: number, material: string) {
            if (!address) {
                pushMessage('No address');
                return;
            }
            pushMessage(JSON.stringify(await contractStore.briq?.mintFT(address, material, qty)) ??
                'Failed to mint, contract is unset');
        },
        async setImpl(contract: any, address: string) {
            if (walletStore?.signer?.signer) {
                let tx = await (walletStore.signer as AccountInterface).execute({
                    contractAddress: contract.getAddress(),
                    entrypoint: 'upgradeImplementation_',
                    calldata: [address],
                });
                pushMessage(JSON.stringify(tx));
            } else {
                let tx = await (walletStore.signer as Signer).invokeFunction(BigInt(contract.getAddress()).toString(), BigInt(snHash.getSelectorFromName('upgradeImplementation_')).toString(), [BigInt(address).toString()]);
                pushMessage(JSON.stringify(tx));
            }
        },
        async invoke(contract: any, method: string, ...args: string[]) {
            let tx = await (walletStore.signer as AccountInterface).execute({
                contractAddress: contract.getAddress(),
                entrypoint: method,
                calldata: args,
            });
            pushMessage(JSON.stringify(tx));
        },
        async customCall() {
            this.cc_pending = true;
            try {
                this.customResult = '';
                let tx;
                if (walletStore?.signer?.signer) {
                    tx = await (walletStore.signer as AccountInterface).execute({
                        contractAddress: this.cc_contract,
                        entrypoint: this.selector,
                        calldata: this.calldata
                            .split(',')
                            .filter((x) => x)
                            .map((x: string) => BigInt(x.trim()).toString()),
                    });
                    pushMessage(JSON.stringify(tx));
                } else {
                    tx = await (walletStore.signer as Signer).invokeFunction(BigInt(this.cc_contract).toString(), BigInt(snHash.getSelectorFromName(this.selector)).toString(), this.calldata
                        .split(',')
                        .filter((x) => x)
                        .map((x: string) => BigInt(x.trim()).toString()));
                    pushMessage(JSON.stringify(tx));
                }
            } catch (err) {
                this.customResult = err.toString();
            }
            this.cc_pending = false;
        },
    },
    components: { Header },
});
</script>
