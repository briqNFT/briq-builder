<script setup lang="ts">
import { reactive } from 'vue'
var ownedBricks = reactive([]);
</script>

<template>
<div id="contract">
    <input type="text" v-model="owner"/>
    <button @click="getBricks">Balance</button>
    <p>Known balance is {{ balance }} </p>
    <p v-if="balance > 0">Bricks: {{ JSON.stringify(bricks) }}</p>
    <p v-else>Bricks: none so far</p>
    <button :disabled="!!minting" @click="minting = 'ready'">Mint</button>
    
    <input type="text" v-model="setId"/>
    <button @click="doExport">Export</button>
    <button @click="doImport">Import</button>
</div>
<div id="mint" v-if="!!minting">
    <p> Token:
        0x<input type="text" v-model="mint_token"/><br/>
        Owner:
        <input type="text" v-model="owner"/><br/>
        Material:
        <select>
            <choice>1</choice>
        </select>
    </p>
    <button :disabled="minting != 'ready'" @click="doMint">Mint</button>
    <p v-if="minting != 'ready'">(...minting...)</p>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { voxWorld } from '../builder.js'
export default defineComponent({
    data() {
        return {
            owner: "0x11",
            balance: 0,
            bricks: [],
            minting: false,
            mint_token: 1,
            setId: 0
        }
    },
    async mounted() {
        this.getBricks()
    },
    methods: {
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
            fetch(`http://localhost:5000/get_bricks/${parseInt(this.owner.substr(2), 16)}`, data)
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
                    "inputs": {
                        "owner": parseInt(this.owner.substr(2), 16),
                        "token_id": parseInt(this.mint_token, 16),
                        "material": 1
                    }
                })
            };
            fetch("http://localhost:5000/call_func/mint", data)
                .then(x => x.json())
                .then(x => this.minting = false, this.getBricks()).catch(x => this.minting = "ready" && console.log(x))
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
                    "data": ret
                })
            };
            fetch("http://localhost:5000/store_set", data)
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
            fetch("http://localhost:5000/store_get/" + this.setId, data)
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
#contract {
    position:fixed;
    top:0;
    right:0;
    width:300px;
    height:150px;
    background:#fff;
    border: 1px solid #ccc;
}

#mint {
    position: fixed;
    top:50%;
    left:50%;
    height:200px;
    width:200px;
    background:#fff;
    border: 1px solid #ccc;
}
</style>