<script setup lang="ts">
import { backendManager } from '@/Backend';
import { Fetchable } from '@/DataFetching';
import { userLegacySetStore } from '@/builder/UserLegacySets';
import { userSetStore } from '@/builder/UserSets';
import contractStore, { ADDRESSES } from '@/chain/Contracts';
import { getPremigrationNetwork, getCurrentNetwork } from '@/chain/Network';
import { maybeStore } from '@/chain/WalletLoading';
import { computed, reactive } from 'vue';

const emit = defineEmits(['close']);

const props = defineProps<{
    selectedItems: string[],
}>();

const migratable = computed(() => props.selectedItems.filter(x => userLegacySetStore.current?.setData?.[x]?.data));
const briqs = computed(() => migratable.value.reduce((acc, x) => acc + (userLegacySetStore.current?.setData[x]?.data?.getNbBriqs?.() || 0), 0));
const notAll = computed(() => migratable.value.length !== props.selectedItems.length);

const migration = reactive(new Fetchable());

const migrateOnly = async () => {
    migration.clear();
    await migration.fetch(async () => {
        await maybeStore.value!.ensureEnabled();
        await maybeStore.value!.signer!.execute([{
            contractAddress: ADDRESSES[getPremigrationNetwork(getCurrentNetwork())!].set,
            entrypoint: 'setApprovalForAll',
            calldata: [ADDRESSES[getCurrentNetwork()].migrate_assets, 1],
        }].concat(migratable.value.map(x => ({
            contractAddress: ADDRESSES[getCurrentNetwork()].migrate_assets,
            entrypoint: 'migrate_legacy_set_briqs',
            calldata: [x, userLegacySetStore.current!.setData[x]!.data!.getNbBriqs()],
        }))));
    });
    if (migration._status === 'LOADED')
        emit('close', 0);
}

const migrateAndRemint = async () => {
    migration.clear();
    await migration.fetch(async () => {
        try {
            await Promise.all(migratable.value.map(x => backendManager.fetch(`v1/check_migrate_set/${getPremigrationNetwork(getCurrentNetwork())!}/${x}`)));
        } catch(error) {
            throw new Error('Could not validate the migration for some selected sets. Please try porting the briqs only.');
        }
        await maybeStore.value!.ensureEnabled();
        const endMigration = migratable.value.map(x => {
            const oldSet = userLegacySetStore.current!.setData[x]!.data!;
            const setData = oldSet.serialize();
            setData.id = contractStore.set!.precomputeTokenId(maybeStore.value!.userWalletAddress, x, oldSet.getNbBriqs());
            return userSetStore.current!.migrateSet(getPremigrationNetwork(getCurrentNetwork())!, x, getCurrentNetwork(), setData);
        });
        const tx = await maybeStore.value!.signer!.execute([{
            contractAddress: ADDRESSES[getPremigrationNetwork(getCurrentNetwork())!].set,
            entrypoint: 'setApprovalForAll',
            calldata: [ADDRESSES[getCurrentNetwork()].migrate_assets, 1],
        }].concat(migratable.value.map(x => ({
            contractAddress: ADDRESSES[getCurrentNetwork()].migrate_assets,
            entrypoint: 'migrate_legacy_set_briqs',
            calldata: [x, userLegacySetStore.current!.setData[x]!.data!.getNbBriqs()],
        }))).concat(migratable.value.map(x => {
            const oldSet = userLegacySetStore.current!.setData[x]!.data!;
            const setData = oldSet.serialize();
            setData.id = contractStore.set!.precomputeTokenId(maybeStore.value!.userWalletAddress, x, oldSet.getNbBriqs());
            return contractStore.set.prepareAssemble(maybeStore.value!.userWalletAddress, x, setData);
        })));
        migratable.value.forEach(x => userLegacySetStore.current!.removeSet(tx.transaction_hash, x));
        endMigration.forEach(x => x.then(x => {
            x(tx.transaction_hash);
        }));
    });
    if (migration._status === 'LOADED')
        emit('close', 1);
}
</script>

<template>
    <Window @close="$emit('close')">
        <template #title>Migrate sets</template>
        <p>We've migrated our Starknet contracts to <span class="font-semibold text-primary"><a href="https://www.dojoengine.org/" target="_blank">Dojo</a></span> !</p>
        <p class="mt-2">
            This requires you to migrate any extra briqs and some NFTs manually.<br>
            Details can be found in the <a class="font-medium text-primary" href="">briqipedia</a> or on <a class="font-medium text-primary" href="https://x.com/briqnft">Twitter</a>.
        </p>
        <p class="my-2">Let us guide you on migrating the following {{ migratable.length > 1 ? `${migratable.length} sets` : 'set' }}:</p>
        <ul class="mt-2 list-disc list-outside ml-6">
            <li class="ml-2 my-2 font-medium" v-for="id in migratable" :key="id">{{ userLegacySetStore.current?.setData[id]?.data?.name }}</li>
        </ul>
        <p v-if="notAll" class="text-xs">(Some of the sets you have selected are already migrated, nothing will happen to those)</p>
        <hr class="bg-grad-light h-[2px] border-0 rounded my-4">
        <p>You have two options:</p>
        <ul class="mt-2 mb-4 list-disc list-outside ml-6 leading-tight">
            <li>
                <p>
                    <span class="font-medium text-info-info">'Migrate briqs only'</span> means you will receive <span class="font-medium">{{ briqs }}</span> briqs, and your NFTs will be disassembled.
                    You can then use those briqs to mint new NFTs on the new contracts.
                </p>
                <p class="py-1">Choose this option if you want to <span class="font-medium">create new items or sell your briqs.</span></p>
            </li>
            <li class="my-2">
                <p><span class="font-medium text-info-info">'Migrate briqs & mint sets'</span> means you will directly mint the same NFTs in the new contracts, thus your briq balance won't change.</p>
                <p class="py-1">Choose this option if you wish to <span class="font-medium">keep those NFTs.</span></p>
            </li>
        </ul>
        <div class="mt-8 mb-2 flex justify-around gap-12 mx-4">
            <Btn class="min-w-[8rem] flex-1" :disabled="migration._status === 'FETCHING'" tooltip="Choose this option if you just want the briqs, not the NFTs" @click="migrateOnly">Migrate briqs only</Btn>
            <Btn class="min-w-[8rem] flex-1" :disabled="migration._status === 'FETCHING'" tooltip="Choose this option if you want to keep your NFTs, not get briqs" @click="migrateAndRemint">Migrate briqs & mint sets</Btn>
        </div>
        <p v-show="migration._status == 'ERROR'" class="font-mono text-copy bg-grad-light mt-4 p-2 rounded text-info-error">{{ migration._error }}</p>
    </Window>
</template>
