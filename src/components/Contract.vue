<script setup lang="ts">
import { reactive } from 'vue'
var ownedBricks = reactive([]);

import { materialData } from '../materials.js'

var names = Object.keys(materialData);
</script>

<template>
<div id="contract">
    <p>Password: <input type="text" v-model="adminStore.secretCode"/></p>

    <input type="text" v-model="owner"/>
    <button @click="getBricks">Balance</button>
    <p>Known balance is {{ balance }} </p>
    <button :disabled="!!minting" @click="minting = 'ready'">Mint</button>
    <br/>
    <input type="text" v-model="setId"/>
    <button @click="doExport">Export</button>
    <button @click="doImport">Import</button>
    <br/>
</div>
<div id="mint" v-if="!!minting">
    <p>Token:
        0x<input type="text" v-model="mint_token"/><br/>
        NB: <input type="number" v-model="mint_nb"/><br/>
        Owner:
        <input type="text" v-model="owner"/><br/>
        Material:
        <select v-model="mint_material">
            <option value="1">{{names[0]}}</option>
            <option value="2">{{names[1]}}</option>
            <option value="3">{{names[2]}}</option>
            <option value="4">{{names[3]}}</option>
        </select>
    </p>
    <button :disabled="minting != 'ready' || !isOk()" @click="doMint">Mint</button>
    <p v-if="minting != 'ready'">(...minting...)</p>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { voxWorld } from '../builder.js'

import { adminStore, isOk } from '../admin'

import getBaseUrl from '../url.js'
var base_url = getBaseUrl();

export default defineComponent({
    data() {
        return {
            adminStore: adminStore,
            owner: "0x11",
            balance: 0,
            bricks: [],
            minting: false,
            mint_token: 1,
            mint_material: 1,
            mint_nb: 50,
            setId: 0
        }
    },
    async mounted() {
    },
    methods: {
        isOk: function() {
            return isOk();
        },
        getBricks: async function() {
            var headers = new Headers();
            headers.append("Content-Type", "application/json");
            var data = {
                method: 'POST',
                headers: headers,
                mode: 'cors',
                body: JSON.stringify({
                    "inputs": {
                    }
                })
            };
            fetch(`${base_url}/get_bricks/${parseInt(this.owner.substr(2), 16)}`, data)
                .then(x => x.json())
                .then(x => {
                    this.balance = x.value.length;
                    this.bricks = x.value.map(x => ({ "token_id": x[0], "mat": x[1], "set": x[2] }));
                }).catch(x => console.log(x))
        },
        doMint: async function() {
            this.minting = "minting";
            var headers = new Headers();
            headers.append("Content-Type", "application/json");
            var data = {
                method: 'POST',
                headers: headers,
                mode: 'cors',
                body: JSON.stringify({
                    "token_start": parseInt(this.mint_token, 16),
                    "material": this.mint_material,
                    "nb": this.mint_nb
                })
            };
            fetch(`${base_url}/mint_bricks/${parseInt(this.owner.substr(2), 16)}`, data)
                .then(x => x.json())
                .then(x => this.minting = false).catch(x => this.minting = "ready" && console.log(x))
        },
        doExport: async function() {
            var ret = {};
            for (const cellId in voxWorld.cells)
            {
                ret[cellId] = [];
                var u8cells = voxWorld.cells[cellId];
                for (let i = 0; i < u8cells.length; ++i)
                {
                    if (u8cells[i] !== 0)
                        ret[cellId].push([i, u8cells[i]])
                }
            }
            var headers = new Headers();
            headers.append("Content-Type", "application/json");
            var data = {
                method: 'POST',
                headers: headers,
                mode: 'cors',
                body: JSON.stringify({
                    "data": ret,
                    "owner": this.owner,
                })
            };
            fetch(`${base_url}/store_set`, data)
                .then(x => x.json())
                .then(x => this.setId = x.value).catch(x => console.log(x))
        },
        doImport: async function() {
            var headers = new Headers();
            headers.append("Content-Type", "application/json");
            let data = {
                method: 'POST',
                headers: headers,
                mode: 'cors',
                body: JSON.stringify({})
            };
            fetch(`${base_url}/store_get/` + this.setId, data)
                .then(x => x.json())
                .then(x => {
                    console.log(x);
                    for (let cell in x.data)
                    {
                        if (!(cell in voxWorld.cells))
                            voxWorld.cells[cell] = new Uint8Array(voxWorld.cellSize * voxWorld.cellSize * voxWorld.cellSize);
                        for (let vox of x.data[cell])
                            voxWorld.cells[cell][vox[0]] = vox[1];
                        voxWorld.updateVoxelGeometry(...cell.split(',').map(x => +x));
                    }
                    console.log(voxWorld)
                    voxWorld.updateVoxelGeometry(0, 0, 0);
                }).catch(x => console.log(x))
        }
        
    },
})
</script>
<style scoped>

</style>