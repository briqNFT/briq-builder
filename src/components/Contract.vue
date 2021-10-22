<template>
<div id="contract">
    <input type="text" v-model="owner"/>
    <button @click="getBalance">Balance</button>
    <p>Known balance is {{ balance }} </p>
    <p v-if="balance > 0">Bricks: {{ bricks.join(", ") }}</p>
    <p v-else>Bricks: none so far</p>
    <button :disabled="!!minting" @click="minting = 'ready'">Mint</button>
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
export default defineComponent({
    data() {
        return {
            owner: "0x11",
            balance: 0,
            bricks: [],
            minting: false,
            mint_token: 1
        }
    },
    async mounted() {
        this.getBalance()
    },
    methods: {
        getBalance: async function() {
            var headers = new Headers();
            headers.append("Content-Type", "application/json");
            var data = {
                method: 'POST',
                headers: headers,
                mode: 'cors',
                body: JSON.stringify({
                    "inputs": {
                        "owner": parseInt(this.owner.substr(2), 16)
                    }
                })
            };
            fetch("http://localhost:5000/call_func/balance_of", data)
                .then(x => x.json())
                .then(x => this.balance = x.value).catch(x => console.log(x))
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
                .then(x => this.minting = false, this.getBalance()).catch(x => this.minting = "ready" && console.log(x))
        }
    },
    watch: {
        balance: async function(neu, old)
        {
            console.log(neu, old)
            var headers = new Headers();
            headers.append("Content-Type", "application/json");
            var data = {
                method: 'POST',
                headers: headers,
                mode: 'cors',
                body: ""
            };
            this.bricks = [];
            for (let i = 0; i < neu; ++i)
            {
                this.bricks.push("...");
                data.body = JSON.stringify({
                    "inputs": {
                        "owner": parseInt(this.owner.substr(2), 16),
                        "index": i
                    }
                });
                fetch("http://localhost:5000/call_func/token_at_index", data)
                    .then(x => x.json())
                    .then(x => this.bricks[i] = x.value);
            }
        }
    }
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