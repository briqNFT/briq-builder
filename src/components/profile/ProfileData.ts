import { computed, ref } from 'vue';
import { userBoxesStore } from '@/builder/UserBoxes';
import { userBookletsStore } from '@/builder/UserBooklets';
import { userSetStore } from '@/builder/UserSets';
import { userLegacySetStore } from '@/builder/UserLegacySets';
import { setsManager } from '@/builder/SetsManager';
import { getCurrentNetwork, getPremigrationNetwork } from '@/chain/Network';
import { pushModal } from '../Modals.vue';
import TextModal from '../generic/TextModal.vue';
import MigrateModal from '../builder/modals/MigrateModal.vue';

export const selectedItems = ref(new Set<string>());

export function deleteSelected() {
    const setText = Array.from(selectedItems.value).map(x => `- ${setsManager.getInfo(x).getSet().name}`);
    pushModal(TextModal, {
        title: 'Confirm deletion',
        text: `This will delete the following ${selectedItems.value.size} WIP sets:\n${setText.join('\n')}\n\nAre you sure?`,
        buttons: [{
            primary: true,
            text: 'Confirm',
        }],
    }).then(btn => {
        if (btn !== 0)
            return;
        for (const setId of selectedItems.value)
            setsManager.deleteLocalSet(setId);
        selectedItems.value.clear();
    })
}

export function disassembleSelected() {
    const disassemblable = Array.from(selectedItems.value).filter(x => userSetStore.current?.setData[x]);
    const setText = disassemblable.map(x => `- ${userSetStore.current?.setData[x]?.data?.name}`);
    const briqs = disassemblable.reduce((acc, x) => acc + (userSetStore.current?.setData[x]?.data?.getNbBriqs?.() || 0), 0);
    const notAllWarning = disassemblable.length !== selectedItems.value.size ? 'WARNING: Some of the selected sets cannot be disassembled.\n\n' : '';
    pushModal(TextModal, {
        title: 'Confirm disassembly',
        text: `This will disassemble the following ${disassemblable.length} sets:\n${setText.join('\n')}\n\nYou will receive ${briqs} briqs.\n\n${(notAllWarning)}Are you sure?`,
        buttons: [{
            primary: true,
            text: 'Confirm',
        }],
    }).then(btn => {
        if (btn !== 0)
            return;
    })
}

export function migrateSets(sets: string[]) {
    pushModal(MigrateModal, {
        selectedItems: sets,
    }).then(btn => {
        if (btn !== 0)
            return;
    })
}

export function useProfileData() {
    const inventoryBoxes = computed(() => {
        if (!userBoxesStore?.current?.availableBoxes)
            return [];
        const ret = [] as string[];
        const nb = {} as Record<string, boolean>;
        for (const box of userBoxesStore.current.availableBoxes)
            if (!nb[box]) {
                nb[box] = true;
                ret.push(box);
            }
        return ret;
    });


    const inventoryBooklets = computed(() => {
        if (!userBookletsStore?.current?.booklets)
            return [];
        const ret = [] as string[];
        const nb = {} as Record<string, boolean>;
        for (const box of userBookletsStore.current.booklets)
            if (!nb[box]) {
                nb[box] = true;
                ret.push(box);
            }
        return ret;
    });

    const creationsWIP = computed(() => {
        return Object.values(setsManager.setsInfo).filter(x => (!x.booklet || x.booklet.startsWith('tutorial')) && !x.onchainId).map(x => x.getSet()) || [];
    })

    const draftBooklets = computed(() => {
        return Object.values(setsManager.setsInfo).filter(x => x.booklet && !x.booklet.startsWith('tutorial')).map(y => {
            const ret = y.getSet();
            ret.booklet = y.booklet;
            return ret;
        }) || [];
    })

    const legacyCreations = computed(() => {
        return userLegacySetStore.current?.sets.map(setId => {
            if (userLegacySetStore.current?.setData[setId]?.booklet_id)
                return undefined;
            const data = userLegacySetStore.current?.setData[setId];
            return {
                id: setId,
                network: getPremigrationNetwork(getCurrentNetwork()),
                name: data?.data?.name || setId,
                nb_briqs: data?.data?.getNbBriqs?.() || 0,
                created_at: data?.created_at || Date.now(),
                pending: userLegacySetStore.current?.metadata[setId]?.status === 'TENTATIVE',
                needs_migration: true,
            }
        }).filter(x => !!x) || [];
    })

    const creations = computed(() => {
        return userSetStore.current?.sets.map(setId => {
            if (userSetStore.current?.setData[setId]?.booklet_id)
                return undefined;
            const data = userSetStore.current?.setData[setId];
            return {
                id: setId,
                network: getCurrentNetwork(),
                name: data?.data?.name || setId,
                nb_briqs: data?.data?.getNbBriqs?.() || 0,
                created_at: data?.created_at || Date.now(),
                pending: userSetStore.current?.metadata[setId]?.status === 'TENTATIVE',
            }
        }).filter(x => !!x) || [];
    })

    const officialCreations = computed(() => {
        return userSetStore.current?.sets.map(setId => {
            if (!userSetStore.current?.setData[setId]?.booklet_id)
                return undefined;
            const data = userSetStore.current?.setData[setId];
            return {
                id: setId,
                name: data?.data?.name || setId,
                nb_briqs: data?.data?.getNbBriqs?.() || 0,
                created_at: data?.created_at || Date.now(),
                pending: userSetStore.current?.metadata[setId]?.status === 'TENTATIVE',
            }
        }).filter(x => !!x) || [];
    })

    return {
        inventoryBoxes,
        inventoryBooklets,
        creationsWIP,
        draftBooklets,
        legacyCreations,
        creations,
        officialCreations,
        selectedItems,
    }
}
