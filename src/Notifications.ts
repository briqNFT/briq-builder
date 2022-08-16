import { reactive, watchEffect } from 'vue';
import { maybeStore } from './chain/WalletLoading';
import { logDebug } from './Messages';

const NOTIFICATION_STORAGE_VERSION = 1;

export class Notification {
    type = 'TEXT' as const;
    version = 1;
    timestamp: number;
    read = false;
    // Mark that this notification is relevant for a given user.
    // Intended as sort of opaque, current format is network/user_address
    user_id: string | undefined;

    data: any;

    constructor(data: any) {
        this.type = data.type;
        this.read = data.read;
        this.timestamp = data.timestamp || Date.now();
        this.user_id = data.user_id ?? maybeStore.value?.user_id;
        this.data = data.data;
    }

    /** For convenience, allow pushing to the manager from a notification type so you only need to import that type. */
    push() {
        notificationsManager.push(this);
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
        };
    }
}

class NotificationManager {
    notifications = [] as Notification[];

    push(notif: Notification) {
        this.notifications.push(notif);
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
