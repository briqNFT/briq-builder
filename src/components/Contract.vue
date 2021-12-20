<script setup lang="ts">
import { materialData } from '../materials.js'
var names = Object.keys(materialData);
</script>

<template>
<div id="contract">
    <p>Password: <input type="text" v-model="adminStore.secretCode"/></p>
    <div id="mint">
        <p>Token:<br/>
            Start: 0x<input type="text" v-model="mint_token"/><br/>
            NB: <input type="number" v-model="mint_nb"/><br/>
            Owner: {{ wallet.userWalletAddress }}<br/>
            Material:
            <select v-model="mint_material">
                <option value="1">{{names[0]}}</option>
                <option value="2">{{names[1]}}</option>
                <option value="3">{{names[2]}}</option>
                <option value="4">{{names[3]}}</option>
            </select>
        </p>
        <button :disabled="minting || !isOk()" @click="doMint">Mint</button>
        <p v-if="minting">(...minting...)</p>
    </div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { adminStore, isOk } from '../Admin'
import contractStore from '../Contracts';

export default defineComponent({
    data() {
        return {
            adminStore: adminStore,
            wallet: this.$store.state.wallet,
            builderData: this.$store.state.builderData,
            minting: false,
            mint_token: 1,
            mint_material: 1,
            mint_nb: 50,
        }
    },
    async mounted() {
    },
    methods: {
        isOk: function() {
            return isOk() && this.wallet.signer;
        },
        doMint: async function() {
            this.minting = true;

            let tx = await contractStore.briq.mint_multiple(this.mint_material, parseInt(this.mint_token, 16), this.mint_nb);
            console.log(tx);
            this.minting = false;
        },        
    },
})
</script>
<style scoped>

</style>