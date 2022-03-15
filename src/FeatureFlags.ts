import { APP_ENV } from "./Meta";

import { reactive, watchEffect } from 'vue';
import { logDebug } from "./Messages";

export const featureFlags = reactive({
    early1_5_access: false,
});

// No leading zeros
const admins = [
    "0x3e46c8abcd73a10cb59c249592a30c489eeab55f76b3496fd9e0250825afe03",
    "0x6043ed114a9a1987fe65b100d0da46fe71b2470e7e5ff8bf91be5346f5e5e3",
    "0x4a9ad47f5086e917bf67077954bd62685d8746c7504026bf43bbecb1fa6dde0",
    "0x583397ff26e17af2562a7e035ee0fbda8f8cbbd1aef5c25b11ea9d8782b1179",
]

const masterBuilders = [
    "0x41d18c96de54181fbf0aa67a78e0b1fc79d540e8d22fa1ee3336d0bba14828a",
    "0x4b0b80a7558483b5f05d7b0158af0699dc07b15d7cf46f1a860b4ba3b0bc9c",
    "0x137c10044d372bab1cb4716528b64e47a9fcb5b98254683aedb1b8db7ffc585",
    "0x23f6c7326d1e0eef3540ed44361a620432f51bc9d732bc15e9dd619a96d7f82",
]

async function checkOnStore() {
    let store = (await import("./Dispatch")).Store;
    await store.isLoaded;
    logDebug("FEATURE_FLAGS - Store loaded");
    watchEffect(() => {
        if (admins.indexOf(store?.store?.state?.wallet?.userWalletAddress) !== -1)
        {
            // Admin-only.
            featureFlags.early1_5_access = true;
        }
        else if (masterBuilders.indexOf(store?.store?.state?.wallet?.userWalletAddress) !== -1)
        {
            featureFlags.early1_5_access = true;
        }
        else
        {
            featureFlags.early1_5_access = false;
        }
    })
};
checkOnStore();
