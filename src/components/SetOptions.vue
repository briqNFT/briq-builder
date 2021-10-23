<script setup lang="ts">
</script>

<template>
<div id="setOptions">
    <p>Owner<input type="text" v-model="owner"/></p>
    <input type="text" v-model="setId"/>
    <button @click="doImport">Import</button>
    <br/>
    <button @click="doExport">Export</button>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { voxWorld } from '../builder.js'
import { brickstore } from '../getter.js'

import getBaseUrl from '../url.js'
var base_url = getBaseUrl();

// returns promise

var fetchData = function(endpoint, body) {
    var headers = new Headers();
    headers.append("Content-Type", "application/json");
    var dat = {
        method: 'POST',
        headers: headers,
        mode: 'cors',
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
            setId: 0
        }
    },
    async mounted() {
        this.getList();
    },
    methods: {
        getList: async function() {
            fetchData("store_list", {}).then(x => console.log(x))
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