import type { SetData } from '@/builder/SetData';
import { setsManager, synchronizeSetsLocally } from '@/builder/SetsManager';
import { useRouter } from 'vue-router';
import TextModalVue from '../generic/TextModal.vue';
import { pushModal } from '../Modals.vue';
import { Notification, pushPopup } from '@/Notifications';

import { router } from '@/Routes';
import { userSetStore } from '@/builder/UserSets';
import DisassembleVue from './modals/Disassemble.vue';
import { downloadJSON } from '@/url';

export function useSetHelpers() {
    const getSetRoute = (setId: string) => router.resolve({ name: 'Builder' }).fullPath + `?set=${setId}`;
    const openSetInBuilder = (setId: string, openInNewWindow?: boolean) => {
        if (openInNewWindow)
            window.open(getSetRoute(setId), '_blank');
        else
            router.push(getSetRoute(setId));
    }

    const createNewSet = () => setsManager.createLocalSet();
    const saveSetAndOpen = (set: SetData) => {
        // Have to force the dump to disk or the new window won't be able to find the set.
        synchronizeSetsLocally(true);
        openSetInBuilder(set.id, true);
    }

    const duplicateSet = (set: SetData) => {
        // TODO -> error reporting.
        return setsManager.duplicateLocally(set);
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

    const disassembleSet = async (setId: string) => {
        return await pushModal(DisassembleVue, { setId: setId });
    }

    const downloadSet = (set: SetData) => {
        downloadJSON(set.serialize(), `${set.getName()}.json`)
    }
    return {
        createNewSet,
        getSetRoute,
        openSetInBuilder,
        saveSetAndOpen,
        duplicateSet,
        deleteLocalSet,
        disassembleSet,
        downloadSet,
    }
}