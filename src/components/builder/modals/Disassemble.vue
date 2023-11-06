<script setup lang="ts">
import { userSetStore } from '@/builder/UserSets';
import Window from '@/components/generic/Window.vue';
import { Notification } from '@/Notifications';
import { computed, onBeforeMount, ref } from 'vue';

const props = defineProps<{
    setId: string,
}>();

const emit = defineEmits(['close']);

const booklet = computed(() => userSetStore.current!.setData[props.setId].booklet_id);
const set = computed(() => userSetStore.current!.setData[props.setId].data!)

onBeforeMount(() => {
    if (!set.value)
        emit('close');
});

const disassembling = ref(false);

const disassembleAndClose = async () => {
    disassembling.value = true;
    try {
        const TX = await userSetStore.current!.disassemble([props.setId]);
        const notif = new Notification({
            type: 'set_delete_sent',
            title: 'Disassembling set',
            level: 'info',
            data: {
                tx_hash: TX.transaction_hash,
                name: set.value.name || `${props.setId.slice(0, 10)}...`,
            },
            read: false,
        }).push();
        notif.read = true;
        emit('close', true);
    } catch(_) {
        disassembling.value = false;
    }
}
</script>

<style scoped>
</style>

<template>
    <Window>
        <template #title>Disassemble '{{ set.getName() }}'</template>
        <p class="my-2">
            Are you sure you want to disassemble your set?<br>
            Your NFT will be burned and you will receive:
        </p>
        <ul class="list-disc list-inside my-4">
            <li class="mb-1">{{ set.getNbBriqs() }} briqs</li>
            <li v-if="booklet">'{{ set.getName() }}' official booklet</li>
        </ul>
        <div class="mt-8 flex justify-end gap-4">
            <Btn :disabled="disassembling" secondary @click="emit('close')">Cancel</Btn>
            <Btn :disabled="disassembling" @click="disassembleAndClose">Confirm</Btn>
        </div>
    </Window>
</template>
