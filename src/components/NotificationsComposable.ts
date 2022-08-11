import { hexUuid } from '@/Uuid';
import { Component, reactive } from 'vue';

export type PopupType = 'info' | 'warning' | 'success' | 'error';

interface Popup {
    _uid: any;
    type: PopupType;
    message: string | Component;
}

export const notificationPopups = reactive([] as Popup[]);

export function pushPopup(type = 'info' as PopupType, message: string | Component) {
    notificationPopups.push({
        _uid: hexUuid(),
        type,
        message,
    })
}
