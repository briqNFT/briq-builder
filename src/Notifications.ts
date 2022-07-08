import { h, reactive, watchEffect } from 'vue';
import { maybeStore } from './chain/WalletLoading';
import { logDebug } from './Messages';

const NOTIFICATION_STORAGE_VERSION = 1;

export abstract class Notif {
    abstract type: string;
    version = 1;
    timestamp: number;
    read = false;
    // Mark that this notification is relevant for a given user.
    // Intended as sort of opaque, current format is network/user_address
    user_id: string | undefined;

    constructor(data: any) {
        this.read = data.read;
        this.timestamp = data.timestamp || Date.now();
        this.user_id = data.user_id ?? maybeStore.value?.user_id;
    }

    /** For convenience, allow pushing to the manager from a notification type so you only need to import that type. */
    push() {
        notificationsManager.push(this);
    }

    shouldShow() {
        return !this.user_id || maybeStore.value?.user_id === this.user_id;
    }

    abstract get summary(): string;

    render(): any {
        return h('p', this.type);
    }

    _serialize() {
        return Object.assign({
            type: this.type,
            read: this.read,
            timestamp: this.timestamp,
            user_id: this.user_id,
        }, this.serialize())
    }

    abstract serialize(): Record<string, any>;
}

class UnprocessedNotification extends Notif {
    serializedData: any;
    type = '__';
    serType: string;

    constructor(serializedData: any) {
        super(serializedData);
        this.serializedData = serializedData;
        this.serType = this.serializedData.type;
    }

    get summary() {
        return this.serializedData;
    }

    serialize() {
        return this.serializedData;
    }
}


class NotificationManager {
    notifications = [] as Notif[];

    notifTypes = {};

    // Recommend calling _processUnprocessed after this to process potentially unprocessed notifications.
    register(uid: string, notifType) {
        console.log('NOTIF MGR - registering ', uid);
        this.notifTypes[uid] = notifType;
    }

    push(notif: Notif) {
        this.notifications.push(notif);
    }

    _setupDiskSync() {
        try {
            const notifs = JSON.parse(window.localStorage.getItem('notifications')!)
            if (notifs.version !== NOTIFICATION_STORAGE_VERSION)
                throw new Error();
            for (const notifData of notifs.notifications)
                this.push(new UnprocessedNotification(notifData));
        } catch(_) {
            // otherwise ignored
            console.error(_);
        }
        console.log('NOTIF MGR - SETUP');
        this._processUnprocessed();
        watchEffect(() => {
            logDebug('SERIALIZING NOTIFICATIONS')
            window.localStorage.setItem('notifications', JSON.stringify({
                version: NOTIFICATION_STORAGE_VERSION,
                notifications: this.notifications.map(x => x._serialize()),
            }))
        });
    }

    _processUnprocessed() {
        for (let i = 0; i < this.notifications.length; ++i) {
            if (this.notifications[i].type !== '__')
                continue;
            const notif = (this.notifications[i] as UnprocessedNotification);
            if (notif.serType in this.notifTypes)
                this.notifications.splice(i, 1, new this.notifTypes[notif.serType](notif.serializedData));
        }

    }
}

export const notificationsManager = reactive(new NotificationManager());
// Setup the sync in the next macrotask so that modules have a chance to register their notification types.
setTimeout(() => notificationsManager._setupDiskSync(), 0);
