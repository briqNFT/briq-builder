<script setup lang="ts">
</script>

<template>
<div id="setOptions"  :class="minimized ? 'mini' : ''">
    <button @click="toggle">{{ minimized ? 'Maximize' : 'Minimize' }}</button>
    <div>
        <div id="setSelector">
            <p v-for="set in Object.keys(sets)" :key="set">
                {{ set }}
                {{ sets[set] }} bricks
                <button @click="doImport(set)">Import</button>
                <button v-if="canDisassemble" @click="doDisassemble(set)">Disassemble</button>
            </p>
        </div>
    </div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { isOk } from '../Admin'
import { builderData } from '../builder/BuilderData'

import { voxWorld } from '../builder.js'
import { pickerData } from '../materials.js'

import getBaseUrl from '../url'
var base_url = getBaseUrl();

var fetchData = function(endpoint: string, body: object = {}): Promise<any>
{
    var headers = new Headers();
    headers.append("Content-Type", "application/json");
    var dat: RequestInit = {
        method: "POST",
        headers: headers,
        mode: "cors",
        body: JSON.stringify(body)
    };
    return fetch(`${base_url}/${endpoint}`, dat)
        .then(x => x.json())
}

export default defineComponent({
    data() {
        return {
            owner: "0x11",
            bricks: [],
            sets: {},
            minimized: false,
        }
    },
    computed: {
        canDisassemble: function() {
            return isOk();
        },
        canExport: function() {
            return true;
            if (!isOk())
                return false;
            for (const mat in pickerData.tempStore)
                if (pickerData.tempStore[mat])
                return true;
            return false;
        }
    },
    async mounted() {
        this.getList();
    },
    methods: {
        toggle: function() {
            this.minimized = !this.minimized;
        },
        getList: async function() {
            fetchData("store_list", {}).then(x => {
                let sets = x.sets.map(x => +(x.replace(".json", "")))
                for (let set of sets)
                    fetchData("store_get/" + set, {}).then(y => {
                        if (!!y.detail)
                            return;
                        this.sets[set] = y.data.briqs.length;
                    });
            });
        },
        doImport: async function(setId) {
            fetchData("store_get/" + setId)
                .then(x => {
                    let set = builderData.newSet();
                    set.id = setId;
                    x.data.id = setId;
                    builderData.currentSet.deserialize(x.data);
                    //builderData.currentSet.swapForFakeBriqs();
                    //builderData.currentSet.name = "Der " + setId;
                }).catch(x => console.log(x))
        },
        doDisassemble: async function(setId) {
            let bricks = []
            for (const brick of builderData.BriqsDB.briqs.values())
            {
                if (brick.set == setId)
                    bricks.push(brick.id)
            }

            var headers = new Headers();
            headers.append("Content-Type", "application/json");
            let data = {
                method: 'POST',
                headers: headers,
                mode: 'cors',
                body: JSON.stringify({
                    token_id: setId,
                    bricks: bricks
                })
            };
            fetch(`${base_url}/store_delete`, data)
                .then(x => x.json())
                .then(x => {
                    this.getList();
                }).catch(x => console.log(x))
        }
    },
})
</script>
<style scoped>
#setOptions {
    position:fixed;
    bottom:0;
    width:100%;
}
#setOptions > div {
    overflow: auto;
    background: rgba(255, 255, 255, 0.5);
}
#setOptions.mini > div {
    display:none;
}
#setOptions > button {
    margin:8px;
    padding:2px;
    position:absolute;
    left: 0;
    top: 0;
}
#setOptions.mini > button {
    position:absolute;
    left: 0;
    transform: translate(0, calc(-100% - 16px));
}
#setSelector {
    display: flex;
    justify-content:center;
    flex-wrap:wrap;
}
#setSelector p {
    display:block;
    width: 100px;
    height: 100px;
    border:2px solid #eee;
    padding:8px;
    margin:8px;
    border-radius:8px;
}
</style>