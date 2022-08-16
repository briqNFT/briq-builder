import { Component, h, reactive, watchEffect } from 'vue';
import { maybeStore } from './chain/WalletLoading';
import { logDebug } from './Messages';

import { hexUuid } from '@/Uuid';

export type NotificationLevel = 'info' | 'warning' | 'success' | 'error';

interface Popup {
    _uid: any;
    level: NotificationLevel;
    title: string;
    component: Component;
}

export const notificationPopups = reactive([] as Popup[]);

export function pushPopup(level = 'info' as NotificationLevel, title: string, message: string | Component) {
    notificationPopups.push({
        _uid: hexUuid(),
        level,
        title,
        component: typeof message === 'string' ? h('p', { class: 'whitespace-pre' }, message) : message,
    })
}

const NOTIFICATION_STORAGE_VERSION = 1;

export class Notification {
    type = 'TEXT' as const;
    version = 1;
    timestamp: number;
    read = false;
    level = 'info' as NotificationLevel;

    // Mark that this notification is relevant for a given user.
    // Intended as sort of opaque, current format is network/user_address
    user_id: string | undefined;

    title: string;
    data: any;

    constructor(data: any) {
        this.type = data.type;
        this.read = data.read;
        this.timestamp = data.timestamp || Date.now();
        this.user_id = data.user_id ?? maybeStore.value?.user_id;
        this.data = data.data;
        this.title = data.title;
    }

    /** For convenience, allow pushing to the manager from a notification type so you only need to import that type. */
    push(maybePopup = false) {
        notificationsManager.push(this, maybePopup);
    }

    shouldShow() {
        return !this.user_id || maybeStore.value?.user_id === this.user_id;
    }

    serialize() {
        return {
            type: this.type,
            read: this.read,
            timestamp: this.timestamp,
            user_id: this.user_id,
            data: this.data,
            title: this.title,
        };
    }
}

class NotificationManager {
    notifications = [] as Notification[];

    push(notif: Notification, maybePopup = false) {
        this.notifications.push(notif);
        if (!notif.read && maybePopup)
            pushPopup(notif.level, notif.title, h('p', notif.data))
    }

    _setupDiskSync() {
        try {
            const notifs = JSON.parse(window.localStorage.getItem('notifications')!)
            if (notifs.version !== NOTIFICATION_STORAGE_VERSION)
                throw new Error();
            for (const notifData of notifs.notifications)
                this.push(new Notification(notifData));
        } catch(_) {
            // otherwise ignored
            console.error(_);
        }
        logDebug('NOTIF MGR - SETUP');
        watchEffect(() => {
            logDebug('SERIALIZING NOTIFICATIONS')
            window.localStorage.setItem('notifications', JSON.stringify({
                version: NOTIFICATION_STORAGE_VERSION,
                notifications: this.notifications.map(x => x.serialize()),
            }))
        });
    }
}

export const notificationsManager = reactive(new NotificationManager());
notificationsManager._setupDiskSync();
