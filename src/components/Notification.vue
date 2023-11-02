<script setup lang="ts">
import type { Notification } from '@/Notifications';
import { readableNumber, readableUnit } from '@/BigNumberForHumans';
import { ExplorerTxUrl } from '@/chain/Explorer';
import { useGenesisStore } from '@/builder/GenesisStore';
import { useSetHelpers } from './builder/SetComposable';

defineProps<{
    notif: Notification,
    toast?: boolean
}>();

const icons = {
    'info': 'far fa-clock',
    'warning': 'far fa-circle-exclamation',
    'success': 'far fa-circle-check',
    'error': 'far fa-circle-xmark',
};

const genesisStore = useGenesisStore();

const { getSetRoute } = useSetHelpers();
</script>

<style scoped>
p {
    @apply text-sm leading-snug mb-1;
}
</style>

<template>
    <div>
        <h5 v-if="!toast" class="font-medium py-2 flex items-center gap-2">
            <i :style="{ color: `rgb(var(--color-info-${notif.level}))` }" :class="`text-md ${icons[notif.level]}`"/> {{ notif.title }}
        </h5>
        <template v-if="notif.type === 'text'">
            <p>{{ notif.data }}</p>
        </template>
        <template v-else-if="notif.type === 'minting_set'">
            <p>Set <RouterLink class="text-primary" :to="`/set/${notif.data.network}/${notif.data.set_id}`">'{{ notif.data.name }}'</RouterLink> is being minted.</p>
        </template>
        <template v-else-if="notif.type === 'set_mint_confirmed'">
            <p>Set <RouterLink class="text-primary" :to="`/set/${notif.data.network}/${notif.data.set_id}`">'{{ notif.data.name }}'</RouterLink> was sucessfully minted.</p>
        </template>
        <template v-else-if="notif.type === 'set_mint_rejected'">
            <p>Set '{{ notif.data.name }}' failed to mint.<br>There was an error with the transaction.</p>
            <p v-if="notif.data.local_set_restored">
                The <RouterLink class="text-primary" :to="getSetRoute(notif.data.local_set_restored)">unminted set</RouterLink> was restored in the work-in-progress section of your profile.
            </p>
        </template>
        <template v-else-if="notif.type === 'set_delete_sent'">
            <p>Set '{{ notif.data.name }}' is being disassembled.</p>
        </template>
        <template v-else-if="notif.type === 'set_delete_confirmed'">
            <p>Set '{{ notif.data.name }}' was sucessfully disassembled.</p>
        </template>
        <template v-else-if="notif.type === 'set_delete_rejected'">
            <p>Set '{{ notif.data.name }}' failed to disassemble.<br>There was an error with the transaction.</p>
        </template>
        <template v-else-if="notif.type === 'set_migration_confirmed'">
            <p>Set '{{ notif.data.name }}' was sucessfully migrated.</p>
        </template>
        <template v-else-if="notif.type === 'set_migration_rejected'">
            <p>Set '{{ notif.data.name }}' failed to migrate.<br>There was an error with the transaction.</p>
        </template>
        <template v-else-if="notif.type === 'bid_pending'">
            <p>Your bidding transaction was sent.</p>
        </template>
        <template v-else-if="notif.type === 'bid_confirmed'">
            <p>Your bidding transaction went through<br>and you now have the winning bid.</p>
            <p>Item: <RouterLink class="text-primary" :to="notif.data.auction_link">{{ notif.data.auction_name }}</RouterLink></p>
        </template>
        <template v-else-if="notif.type === 'bid_outbid'">
            <p>Another user now has the winning bid.</p>
            <p>Item: <RouterLink class="text-primary" :to="notif.data.auction_link">{{ notif.data.auction_name }}</RouterLink></p>
        </template>
        <template v-else-if="notif.type === 'bid_failure'">
            <p>There was an error with the bidding transaction.</p>
            <p v-if="toast"><a :href="ExplorerTxUrl(notif.data.tx_hash)" target="_blank" class="text-primary">See details on StarkScan</a></p>
            <p>Item: <RouterLink class="text-primary" :to="notif.data.auction_link">{{ notif.data.auction_name }}</RouterLink></p>
        </template>
        <template v-else-if="notif.type === 'briq_purchase_pending'">
            <p>{{ notif.data.amount }} briqs are being bought.</p>
            <p v-if="toast"><a :href="ExplorerTxUrl(notif.data.tx_hash)" target="_blank" class="text-primary">See details on StarkScan</a></p>
        </template>
        <template v-else-if="notif.type === 'briq_purchase_confirmed'">
            <p>You bought {{ notif.data.amount }} briqs.</p>
            <p v-if="toast"><a :href="ExplorerTxUrl(notif.data.tx_hash)" target="_blank" class="text-primary">See details on StarkScan</a></p>
        </template>
        <template v-else-if="notif.type === 'briq_purchase_rejected'">
            <p>There was an error with the briq purchase transaction.</p>
            <p v-if="toast"><a :href="ExplorerTxUrl(notif.data.tx_hash)" target="_blank" class="text-primary">See details on StarkScan</a></p>
        </template>
        <template v-else-if="notif.type === 'box_purchase_started'">
            <p>The transaction to purchase your box was sent.</p>
            <p>Box: <RouterLink class="text-primary" :to="`/box/${notif.data.box_id}`">{{ genesisStore.metadata[notif.data.box_id]?._data?.name ?? notif.data.box_id }}</RouterLink></p>
        </template>
        <template v-else-if="notif.type === 'box_purchase_pending'">
            <p>Your box purchase transaction is pending.<br>You can now start unboxing.</p>
            <p>Box: <RouterLink class="text-primary" :to="`/box/${notif.data.box_id}`">{{ genesisStore.metadata[notif.data.box_id]?._data?.name ?? notif.data.box_id }}</RouterLink></p>
        </template>
        <template v-else-if="notif.type === 'box_purchase_confirmed'">
            <p>Your box purchase was confirmed on StarkNet.</p>
            <p>Box: <RouterLink class="text-primary" :to="`/box/${notif.data.box_id}`">{{ genesisStore.metadata[notif.data.box_id]?._data?.name ?? notif.data.box_id }}</RouterLink></p>
        </template>
        <template v-else-if="notif.type === 'box_purchase_failure'">
            <p>There was an error with the box purchase transaction.</p>
            <p v-if="toast"><a :href="ExplorerTxUrl(notif.data.tx_hash)" target="_blank" class="text-primary">See details on StarkScan</a></p>
            <p>Box: <RouterLink class="text-primary" :to="`/product/${notif.data.box_id}`">{{ genesisStore.metadata[notif.data.box_id]?._data?.name ?? notif.data.box_id }}</RouterLink></p>
        </template>

        <template v-else-if="notif.type === 'box_unbox_started'">
            <p>The unboxing transaction was sent.</p>
            <p>Box: <RouterLink class="text-primary" :to="`/box/${notif.data.box_id}`">{{ genesisStore.metadata[notif.data.box_id]?._data?.name ?? notif.data.box_id }}</RouterLink></p>
        </template>
        <template v-else-if="notif.type === 'box_unbox_confirmed'">
            <p>Your unboxing was confirmed on StarkNet.</p>
            <p>Box: <RouterLink class="text-primary" :to="`/box/${notif.data.box_id}`">{{ genesisStore.metadata[notif.data.box_id]?._data?.name ?? notif.data.box_id }}</RouterLink></p>
        </template>
        <template v-else-if="notif.type === 'box_unbox_failure'">
            <p>There was an error with the unbox transaction.</p>
            <p v-if="toast"><a :href="ExplorerTxUrl(notif.data.tx_hash)" target="_blank" class="text-primary">See details on StarkScan</a></p>
            <p>Box: <RouterLink class="text-primary" :to="`/product/${notif.data.box_id}`">{{ genesisStore.metadata[notif.data.box_id]?._data?.name ?? notif.data.box_id }}</RouterLink></p>
        </template>

        <template v-else-if="['tentative_bid', 'confirmed_bid', 'pending_bid', 'rejected_bid'].indexOf(notif.type) !== -1">
            <p>Bid: <span class="font-medium">{{ readableNumber(notif.data.amount) }} {{ readableUnit(notif.data.amount) }}</span></p>
            <p>Item: <RouterLink class="text-primary" :to="`/product/${notif.data.box_id}`">{{ genesisStore.metadata[notif.data.box_id]?._data?.name ?? notif.data.box_id }}</RouterLink></p>
        </template>
        <p v-show="!toast" class="text-xs text-grad-dark mt-2 flex justify-between">
            <span>{{ new Date(notif.timestamp).toLocaleString("en-uk", { dateStyle: "long", timeStyle: "short" }) }}</span>
            <span v-if="notif.data.tx_hash"><a :href="ExplorerTxUrl(notif.data.tx_hash)" target="_blank" class="text-primary">See transaction</a></span>
        </p>
    </div>
</template>
