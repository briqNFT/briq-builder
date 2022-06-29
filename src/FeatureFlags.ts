import { reactive, watchEffect } from 'vue';
import { logDebug } from './Messages';

export const featureFlags = reactive({
    multiMaterials: false,
    bigBuilder: false,
});

// No leading zeros
const admins = [
    '0x3e46c8abcd73a10cb59c249592a30c489eeab55f76b3496fd9e0250825afe03',
    '0x6043ed114a9a1987fe65b100d0da46fe71b2470e7e5ff8bf91be5346f5e5e3',
    '0x4a9ad47f5086e917bf67077954bd62685d8746c7504026bf43bbecb1fa6dde0',
    '0x583397ff26e17af2562a7e035ee0fbda8f8cbbd1aef5c25b11ea9d8782b1179',
];

const Stefan = '0x51761d49c74a0790f4412973cef39015f0aec0ddf3619094e2c59e5682646c5';

const starBuilders = [
    '0x583397ff26e17af2562a7e035ee0fbda8f8cbbd1aef5c25b11ea9d8782b1179',
    '0x4a9ad47f5086e917bf67077954bd62685d8746c7504026bf43bbecb1fa6dde0',
    '0x41d18c96de54181fbf0aa67a78e0b1fc79d540e8d22fa1ee3336d0bba14828a',
    '0x4b0b80a7558483b5f05d7b0158af0699dc07b15d7cf46f1a860b4ba3b0bc9c',
    '0x137c10044d372bab1cb4716528b64e47a9fcb5b98254683aedb1b8db7ffc585',
    '0x192690c6c3ca5e18a044f21a2e3d676ceb830efccf80bf382e33d01b3c834db',
    '0x23f6c7326d1e0eef3540ed44361a620432f51bc9d732bc15e9dd619a96d7f82',
    '0x11a53a81b97018da4ebf1d377389abf759224e7be5c1fcc1fe3b02aacbdb673',
    '0xe8d027b8477d8ad71535eae09d1c91d3103d9f33608fbade6c53299e378c05',
    '0x47f6cb50b946c7734de800fb4e448d84197b7078891d90b99236af00cc6f438',
    '0x7ae7bbb04f49d5a4941c2f6888d2c1e32deb62aab737d83e3104090730ed275',
];

async function checkOnStore() {
    const wallet = (await import('./Dispatch')).Wallet;
    logDebug('FEATURE_FLAGS - Loaded');
    watchEffect(() => {
        if (admins.indexOf(wallet.walletStore2.userWalletAddress) !== -1)
            // Admin-only.
            featureFlags.multiMaterials = true;
        else if (starBuilders.indexOf(wallet.walletStore2.userWalletAddress) !== -1)
            featureFlags.multiMaterials = false;
        else
            featureFlags.multiMaterials = false;
        if (wallet.walletStore2.userWalletAddress === Stefan || admins.indexOf(wallet.walletStore2.userWalletAddress) !== -1)
            featureFlags.bigBuilder = true;

    });
}
checkOnStore();
