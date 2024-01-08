import { reactive } from 'vue';
import { adminBackendManager } from './Backend';

export const authStore = reactive({
    authenticated: false,
})

export const checkAuth = async () => {
    try {
        await adminBackendManager.fetch('v1/auth/check');
        authStore.authenticated = true;
    } catch (e) {
        authStore.authenticated = false;
    }
}
