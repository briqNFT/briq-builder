import { APP_ENV } from "./Meta";

import { reactive, watchEffect } from 'vue';
import { logDebug } from "./Messages";

export const featureFlags = reactive({
    briq_select_movement: true,
});

async function checkOnStore() {
    let store = (await import("./Dispatch")).Store;
    await store.isLoaded;
    logDebug("FEATURE_FLAGS - Store loaded");
    watchEffect(() => {
        if (store?.store?.state?.wallet?.userWalletAddress == "0x3e46c8abcd73a10cb59c249592a30c489eeab55f76b3496fd9e0250825afe03" ||
            store?.store?.state?.wallet?.userWalletAddress == "0x6043ed114a9a1987fe65b100d0da46fe71b2470e7e5ff8bf91be5346f5e5e3")
        {
            // Admin-only.
        }
    })
};
checkOnStore();
