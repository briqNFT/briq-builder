<script setup lang="ts">
</script>

<template>
<div id="setOptions"  :class="minimized ? 'mini' : ''">
    <button @click="toggle">{{ minimized ? 'Maximize' : 'Minimize' }}</button>
    <div>
        <p><button @click="doExport" :disabled="!canExport">Export</button></p>
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
import { voxWorld } from '../builder.js'
import { pickerData } from '../materials.js'
import { isOk, adminStore } from '../Admin'

import { builderData } from '../builder/BuilderData'

import getBaseUrl from '../url.js'
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
                        console.log(y.data);
                        this.sets[set] = y.data.briqs.length;
                    });
            });
        },
        doExport: async function() {
            // Replace briqs by proper ones.
            builderData.currentSet.swapForRealBriqs();
            let data = builderData.currentSet.serialize();
            let used_cells = data.briqs.map(x => x.data.briq);
            fetchData("store_set", {
                "used_cells": used_cells,
                "data": data,
                "owner": parseInt(this.owner, 16),
            }).then(_ => {
                builderData.disassembleSet(builderData.currentSet.id);
            })
        },
        doImport: async function(setId) {
            fetchData("store_get/" + setId)
                .then(x => {
                    builderData.newSet();
                    x.data.id = builderData.currentSet.id;
                    builderData.currentSet.deserialize(x.data);
                    builderData.currentSet.swapForFakeBriqs();
                    builderData.currentSet.name = "Der " + setId;
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