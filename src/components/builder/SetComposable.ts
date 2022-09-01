import type { SetData } from '@/builder/SetData';
import { setsManager, synchronizeSetsLocally } from '@/builder/SetsManager';
import { useRouter } from 'vue-router';
import TextModalVue from '../generic/TextModal.vue';
import { pushModal } from '../Modals.vue';
import { pushPopup } from '@/Notifications';

import { router } from '@/Routes';

export function useSetHelpers() {
    const openSetInBuilder = (setId: string) => {
        window.open(router.resolve({ name: 'Builder' }).fullPath + `?set=${setId}`, '_blank');
    }
    const createNewSetAndOpen = (set ?: SetData) => {
        if (!set)
            set = setsManager.createLocalSet();
        else
            setsManager.registerLocalSet(set);
        // Have to force the dump to disk or the new window won't be able to find the set.
        synchronizeSetsLocally();
        openSetInBuilder(set.id);
    }

    const duplicateSet = (setId: string) => {
        // TODO -> error reporting.
        return setsManager.duplicateLocally(setsManager.getInfo(setId).getSet()!);
    };
    const deleteLocalSet = (setId: string, force = false) => {
        const setInfo = setsManager.getInfo(setId);
        // Ask for confirmation on non-empty sets.
        if (!force && setInfo.status === 'LOCAL' && (setInfo?.local?.getNbBriqs() ?? 0) > 0)
            pushModal(TextModalVue, {
                title: 'Confirm delete?',
                text: 'This set will be deleted. This cannot be undone. Are you sure?',
                buttons: [{ text: 'Yes' }, { text: 'No' }],
            }).then(btn => btn === 0 ? deleteLocalSet(setId, true) : null)
        else {
            setsManager.deleteLocalSet(setId);
            pushPopup('success', 'Set deleted', 'Set successfully deleted');
        }
    };

    return {
        openSetInBuilder,
        createNewSetAndOpen,
        duplicateSet,
        deleteLocalSet,
    }
}