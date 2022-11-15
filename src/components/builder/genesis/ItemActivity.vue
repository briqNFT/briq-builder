<script setup lang="ts">
import { backendManager } from '@/Backend';
import { ExplorerTxUrl } from '@/chain/Explorer';
import { computed } from 'vue';


const props = defineProps<{
    type: 'set' | 'booklet' | 'box',
    network: string,
    item: string,
    user?: string,
}>();

const data = await backendManager.fetch(`v1/activity/${props.type}/${props.network}/${props.item}`);

data.sort((a, b) => {
    return b.block - a.block;
});

const user_wallet = computed(() => props.user?.split('/')?.[1])

const actualData = computed(() => data.map((item: unknown) => {
    if (props.type === 'set') {
        if (item.from === '0x0')
            return {
                kind: 'minted',
                by: item.to.slice(0, 6) + '...' + item.to.slice(-3),
                date: new Date(item.timestamp),
                tx_hash: item.tx_hash,
            }
    } else if (props.type === 'booklet') {
        if (!user_wallet.value || !(item.from === user_wallet.value || item.to === user_wallet.value))
            return null;
        else if (item.from === user_wallet.value)
            return {
                kind: 'wrapped',
                by: item.from.slice(0, 6) + '...' + item.from.slice(-3),
                set_id: item.to.slice(0, 6) + '...' + item.to.slice(-3),
                date: new Date(item.timestamp),
                tx_hash: item.tx_hash,
            }
        else if (item.to === user_wallet.value)
            return {
                kind: 'unwrapped',
                by: item.to.slice(0, 6) + '...' + item.to.slice(-3),
                set_id: item.from.slice(0, 6) + '...' + item.from.slice(-3),
                date: new Date(item.timestamp),
                tx_hash: item.tx_hash,
            }
    } else if (props.type === 'box')
        if (!user_wallet.value || !(item.from === user_wallet.value || item.to === user_wallet.value))
            return null;
        else if (item.from === user_wallet.value && item.to === '0x0')
            return {
                kind: 'unboxed',
                by: item.from.slice(0, 6) + '...' + item.from.slice(-3),
                set_id: item.to.slice(0, 6) + '...' + item.to.slice(-3),
                date: new Date(item.timestamp),
                tx_hash: item.tx_hash,
            }
        else if (item.from === '0x344c97a38c9b5f632e0f1de386402ff0e3ebcf6878a65f588aa4375f9750c00')
            return {
                kind: 'bought',
                by: item.to.slice(0, 6) + '...' + item.to.slice(-3),
                date: new Date(item.timestamp),
                tx_hash: item.tx_hash,
            }
}).filter(x => x));

const icons = {
    'minted': 'fa-fingerprint',
    'wrapped': 'fa-gift',
    'unwrapped': 'fa-box-open',
    'unboxed': 'fa-box-open',
    'bought': 'fa-coins',
}
</script>


<style scoped>
</style>

<template>
    <h2 v-show="actualData.length">Item activity</h2>
    <div v-show="actualData.length" class="rounded-md bg-grad-lightest border border-grad-light max-h-[21rem] overflow-auto">
        <div
            v-for="(item, i) of actualData" :key="i"
            class="border-b border-grad-light last:border-b-0 px-6 flex gap-6 items-center py-4">
            <p class="w-6 h-6 flex justify-center items-center text-xl"><i :class="`fa-duotone ${icons[item.kind]}`"/></p>
            <div class="flex-1">
                <p class="font-medium mb-2">
                    <template v-if="item.kind === 'minted'">Minted by <span class="text-primary">{{ item.by }}</span></template>
                    <template v-if="item.kind === 'wrapped'">Official set minted by <span class="text-primary">{{ item.by }}</span></template>
                    <template v-if="item.kind === 'unwrapped'">Set disassembled by <span class="text-primary">{{ item.by }}</span></template>
                    <template v-if="item.kind === 'bought'">Bought one</template>
                    <template v-if="item.kind === 'unboxed'">Opened one</template>
                </p>
                <p class="text-xs">on <span class="text-grad-dark">{{ item.date.toLocaleString("en-uk", { dateStyle:"long" }) }}</span></p>
            </div>
            <a :href="ExplorerTxUrl(item.tx_hash, network)" v-if="item.tx_hash"><i class="text-lg fas fa-arrow-up-right-from-square"/></a>
        </div>
    </div>
</template>
