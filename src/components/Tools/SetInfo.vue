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

import { fetchData } from '../../url';

export default defineComponent({
    data() {
        return {
            set: toRef(this.$store.state.builderData, "currentSet"),
        };
    },
    methods: {
        disassemble: function() {
            this.$store.dispatch("builderData/delete_wip_set", this.set.id);
        },
        swapReal: function() {
            this.$store.dispatch("builderData/swap_for_real_briqs", this.set.id);
        },
        resetBriqs: function() {
            this.$store.dispatch("builderData/swap_for_fake_briqs", this.set.id);
        },
        makeCopy: async function() {
            let data = this.set.serialize();
            let set =  await this.$store.dispatch("builderData/create_wip_set", { ...data, id: Date.now(), name: data.name + " Copy" });
        },
        doExport: function() {
            try
            {
                this.set.swapForRealBriqs(this.$store.state.builderData.briqsDB);
            }
            catch(e) {
                return;
            }
            let data = this.$store.state.builderData.currentSet.serialize();
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
