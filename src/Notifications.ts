import { reactive } from 'vue';

class NotificationManager {
    notifications = [] as Notification[];

    push(notif: Notification) {
        this.notifications.push(notif);
    }
}

export const notificationsManager = reactive(new NotificationManager());
