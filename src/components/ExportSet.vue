<template>
    <div class="w-1/2">
        <div class="relative">
            <h3 class="text center w-full">Export set</h3>
            <p>Set {{ metadata.set }}</p>
            <p>Name: {{ set.name }}</p>
            <p>Briqs: {{ set.briqsDB.briqs.size }}</p>
            <button class="btn float-left" @click="$emit('close')">Cancel & Close</button>
            <button class="btn float-right" @click="exportSet">Export</button>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
    data() {
        return {
            name: "",
        }
    },
    props: ["metadata"],
    emits: ["close"],
    mounted() {
        this.name = this.set.name;
    },
    computed: {
        set: function() {
            return this.$store.state.builderData.wipSets.filter(x => x.id === this.metadata.set)?.[0];
        }
    },
    methods: {
        exportSet: async function() {
            if (!this.$store.state.builderData.setContract)
                return;
            this.$store.dispatch("builderData/swap_for_real_briqs");
            let data = this.$store.state.builderData.currentSet.serialize();
            console.log(data);
            let TX = await this.$store.state.builderData.setContract.mint(this.$store.state.wallet.userWalletAddress, "" + data.id, data.briqs.map(x => "" + x.data.briq));
            console.log(TX);
        }
    }
})
</script>