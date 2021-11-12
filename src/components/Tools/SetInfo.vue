<template>
    <div>
        <h2>Set Info</h2>
        <p>ID: {{ set.id }}</p>
        <p>Name: <input type="text" v-model="set.name"></p>
        <p><button @click="swapReal">Swap for real briqs</button></p>
        <p><button @click="resetBriqs">Reset real briqs</button></p>
        <p><button @click="makeCopy">Make Copy</button></p>
        <p><button @click="disassemble">Disassemble Set</button></p>
        <p><button @click="doExport">Export Set</button></p>
    </div>
</template>

<script lang="ts">
import { defineComponent, toRef } from 'vue';
import { builderData } from '../../builder/BuilderData';

import { fetchData } from '../../url';

export default defineComponent({
    data() {
        return {
            set: toRef(builderData, "currentSet"),
        };
    },
    methods: {
        disassemble: function() {
            builderData.disassembleSet(this.set.id);
        },
        swapReal: function() {
            this.set.swapForRealBriqs(builderData.BriqsDB);
        },
        resetBriqs: function() {
            this.set.swapForFakeBriqs();
        },
        makeCopy: function() {
            let data = this.set.serialize();
            let set = builderData.newSet();
            data.id = set.id;
            set.deserialize(data);
            set.name += " Copy";
        },
        doExport: function() {
            try
            {
                this.set.swapForRealBriqs(builderData.BriqsDB);
            }
            catch(e) {
                return;
            }
            let data = builderData.currentSet.serialize();
            let used_cells = data.briqs.map((x: any) => x.data.briq);
            fetchData("store_set", {
                "used_cells": used_cells,
                "data": data,
                "owner": 17, // TODO: real owner
            }).then(x => { this.set.id = x.value; });
        }
    }
})
</script>

<style scoped>
div p {
    text-align: left;
}
</style>
