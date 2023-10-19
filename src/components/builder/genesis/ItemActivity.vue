<script setup lang="ts">
import { backendManager } from '@/Backend';
import { ADDRESSES } from '@/chain/Contracts';
import { ExplorerTxUrl } from '@/chain/Explorer';
import * as starknet from 'starknet';
import { computed } from 'vue';


const props = defineProps<{
    type: 'set' | 'booklet' | 'box',
    network: string,
    item: string,
    user?: string,
}>();

const data = await backendManager.fetch(`v1/activity/${props.type}/${props.network}/${props.item}`);

const user_wallet = computed(() => props.user?.split('/')?.[1])

const actualData = computed(() => data.map((item: unknown) => {
    if (props.type === 'set')
        if (item.from === '0x0')
            return {
                kind: 'minted',
                by: item.to.slice(0, 6) + '...' + item.to.slice(-3),
                date: new Date(item.timestamp),
                tx_hash: item.tx_hash,
            }
        else if (item.to === '0x0')
            return {
                kind: 'disassembled',
                by: item.from.slice(0, 6) + '...' + item.from.slice(-3),
                date: new Date(item.timestamp),
                tx_hash: item.tx_hash,
            }
        else
            return {
                kind: 'transferred',
                by: item.from.slice(0, 6) + '...' + item.from.slice(-3),
                to: item.to.slice(0, 6) + '...' + item.to.slice(-3),
                date: new Date(item.timestamp),
                tx_hash: item.tx_hash,
            }

    else if (props.type === 'booklet')
        return null;
    /*
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
        */
    else if (props.type === 'box')
        if (!user_wallet.value || !(BigInt(item.from) === BigInt(user_wallet.value) || BigInt(item.to) === BigInt(user_wallet.value)))
            return null;
        else if (BigInt(item.from) === BigInt(user_wallet.value) && item.to === '0x0')
            return {
                kind: 'unboxed',
                by: item.from.slice(0, 6) + '...' + item.from.slice(-3),
                set_id: item.to.slice(0, 6) + '...' + item.to.slice(-3),
                date: new Date(item.timestamp),
                tx_hash: item.tx_hash,
            }
        else if (BigInt(item.from) === BigInt(ADDRESSES[props.network]?.auction || 0) && BigInt(item.to) === BigInt(user_wallet.value))
            return {
                kind: 'bought',
                by: item.to.slice(0, 6) + '...' + item.to.slice(-3),
                date: new Date(item.timestamp),
                tx_hash: item.tx_hash,
            }
        else if (BigInt(item.to) === BigInt(user_wallet.value))
            return {
                kind: 'obtained',
                by: item.to.slice(0, 6) + '...' + item.to.slice(-3),
                date: new Date(item.timestamp),
                tx_hash: item.tx_hash,
            }
}).filter(x => x).sort((a, b) => {
    if (a.date - b.date !== 0)
        return b.date - a.date;
    if (a.kind === 'unboxed')
        return -1;
    if (b.kind === 'unboxed')
        return 1;
    return 0;
}));

const icons = {
    'minted': 'fa-fingerprint',
    'disassembled': 'fa-recycle',
    'transferred': 'fa-arrow-right-arrow-left',
    'wrapped': 'fa-gift',
    'unwrapped': 'fa-box-open',
    'unboxed': 'fa-box-open',
    'bought': 'fa-coins',
    'obtained': 'fa-parachute-box',
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
                    <template v-if="item.kind === 'disassembled'">Disassembled by <span class="text-primary">{{ item.by }}</span></template>
                    <template v-if="item.kind === 'transferred'">Transferred by <span class="text-primary">{{ item.by }}</span> to <span class="text-primary">{{ item.to }}</span></template>
                    <template v-if="item.kind === 'wrapped'">Official set minted by <span class="text-primary">{{ item.by }}</span></template>
                    <template v-if="item.kind === 'unwrapped'">Set disassembled by <span class="text-primary">{{ item.by }}</span></template>
                    <template v-if="item.kind === 'bought'">Bought one</template>
                    <template v-if="item.kind === 'obtained'">Obtained one</template>
                    <template v-if="item.kind === 'unboxed'">Opened one</template>
                </p>
                <p class="text-xs">on <span class="text-grad-dark">{{ item.date.toLocaleString("en-uk", { dateStyle:"long" }) }}</span></p>
            </div>
            <a :href="ExplorerTxUrl(item.tx_hash, network)" v-if="item.tx_hash"><i class="text-lg fas fa-arrow-up-right-from-square"/></a>
        </div>
    </div>
</template>
