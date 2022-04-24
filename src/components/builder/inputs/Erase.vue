<template>
    <div v-if="getUsedBriqsNb" class="w-full">
        <Btn class="w-full" @click="openModalToConfirmClear">Clear All</Btn>
    </div>
</template>

<script lang="ts">
import ConfirmClearAll from '../modals/ConfirmClearAll.vue';
import { pushModal } from '../../Modals.vue';
import { defineComponent } from 'vue';
export default defineComponent({
    computed: {
        getUsedBriqsNb(): number {
            let used = 0;
            for (let mat in this.$store.state.builderData.currentSet.usedByMaterial)
                used += this.$store.state.builderData.currentSet.usedByMaterial[mat];
            return used;
        },
    },
    methods: {
        async openModalToConfirmClear(): Promise<void> {
            const userConfirmed = await pushModal(ConfirmClearAll, { asModal: true });
            if (userConfirmed) await this.$store.dispatch("builderData/clear");;
        },
    }
})
</script>
