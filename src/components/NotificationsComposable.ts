import { hexUuid } from '@/Uuid';
import { reactive } from 'vue';

export type PopupType = 'info' | 'warning' | 'success' | 'error';

interface Popup {
    _uid: any;
    type: PopupType;
}

export const notificationPopups = reactive([] as Popup[]);

export function pushPopup(type = 'info' as PopupType) {
    notificationPopups.push({
        _uid: hexUuid(),
        'type': type,
    })
}
