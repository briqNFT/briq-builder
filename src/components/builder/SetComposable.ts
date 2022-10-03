import type { SetData } from '@/builder/SetData';
import { setsManager, synchronizeSetsLocally } from '@/builder/SetsManager';
import { useRouter } from 'vue-router';
import TextModalVue from '../generic/TextModal.vue';
import { pushModal } from '../Modals.vue';
import { Notification, pushPopup } from '@/Notifications';

import { router } from '@/Routes';
import { userSetStore } from '@/builder/UserSets';

export function useSetHelpers() {
    const openSetInBuilder = (setId: string, openInNewWindow?: boolean) => {
        if (openInNewWindow)
            window.open(router.resolve({ name: 'Builder' }).fullPath + `?set=${setId}`, '_blank');
        else
            router.push(router.resolve({ name: 'Builder' }).fullPath + `?set=${setId}`);
    }

    const createNewSet = () => setsManager.createLocalSet();
    const saveSetAndOpen = (set: SetData) => {
        // Have to force the dump to disk or the new window won't be able to find the set.
        synchronizeSetsLocally();
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
        const TX = await userSetStore.current!.disassemble(setId);
        router.push({ name: 'Profile' });
        const notif = new Notification({
            type: 'set_delete_sent',
            title: 'Disassembling set',
            level: 'info',
            data: {
                tx_hash: TX.transaction_hash,
            },
            read: false,
        }).push();
        notif.read = true;
    }


    return {
        createNewSet,
        openSetInBuilder,
        saveSetAndOpen,
        duplicateSet,
        deleteLocalSet,
        disassembleSet,
    }
}