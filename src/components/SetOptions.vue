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
import { brickstore } from '../getter.js'
import { pickerData } from '../materials.js'
import { isOk, adminStore } from '../admin'

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
                        let nb = 0;
                        for (const cell in y.data)
                            nb += y.data[cell].length;
                        this.sets[set] = nb;
                    });
            });
        },
        doExport: async function() {
            var ret = {};
            var used_cells = [];
            var available_by_matos = {
                "1": [],
                "2": [],
                "3": [],
                "4": [],
            };
            for (const brick of brickstore.user_bricks)
            {
                if (brick.set !== 0)
                    continue;
                available_by_matos[brick.mat].push(brick.token_id)
            }
            for (const cellId in voxWorld.cells)
            {
                ret[cellId] = [];
                var u8cells = voxWorld.cells[cellId];
                for (let i = 0; i < u8cells.length; ++i)
                {
                    if (u8cells[i] !== 0)
                    {
                        if (!available_by_matos[u8cells[i]].length)
                        {
                            console.log("not available");
                            return;
                        }
                        var item = available_by_matos[u8cells[i]].splice(0, 1);
                        used_cells.push(item[0]);
                        ret[cellId].push([i, u8cells[i]])
                    }
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
                    "used_cells": used_cells,
                    "owner": this.owner,
                })
            };
            fetch(`${base_url}/store_set`, data)
                .then(x => x.json())
                .then(x => this.getList()).catch(x => console.log(x))
        },
        doImport: async function(setId) {
            fetchData("store_get/" + setId)
                .then(x => {
                    builderData.reset();
                    pickerData.tempStore = { 1: 0, 2: 0,3: 0,4: 0 };
                    /*
                    for (let cell in x.data)
                    {
                        for (let vox of x.data[cell])
                        {
                            builderData.placeBriq()
                            voxWorld.cells[cell][vox[0]] = vox[1];
                            pickerData.tempStore[vox[1]]++;
                        }
                        voxWorld.updateCellGeometry(...cell.split(',').map(x => +x * voxWorld.cellSize));
                    }
                    */
                    /*
                    const to_reset = Object.keys(voxWorld.cells);
                    voxWorld.cells = {};
                    for (const to_res of to_reset)
                        voxWorld.updateCellGeometry(...to_res.split(',').map(x => +x * voxWorld.cellSize));
                    pickerData.tempStore = { 1: 0, 2: 0,3: 0,4: 0 };
                    for (let cell in x.data)
                    {
                        if (!(cell in voxWorld.cells))
                            voxWorld.cells[cell] = new Uint8Array(voxWorld.cellSize * voxWorld.cellSize * voxWorld.cellSize);
                        for (let vox of x.data[cell])
                        {
                            voxWorld.cells[cell][vox[0]] = vox[1];
                            pickerData.tempStore[vox[1]]++;
                        }
                        voxWorld.updateCellGeometry(...cell.split(',').map(x => +x * voxWorld.cellSize));
                    }*/
                }).catch(x => console.log(x))
        },
        doDisassemble: async function(setId) {
            let bricks = []
            for (const brick of brickstore.user_bricks)
            {
                if (brick.set == setId)
                bricks.push(brick.token_id)
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