import { getKeyPair, getStarkKey } from 'starknet/dist/utils/ellipticCurve';
import { getProviderForNetwork } from './Provider';

import { Account } from 'starknet';
import { APP_ENV } from '@/Meta';

export function setupMockWallet() {
    if (APP_ENV !== 'dev')
        return

    const keypair = getKeyPair(0x123456)
    getStarkKey(keypair);
    window.useDebugProvider = async () => {
        const wallet = (await import('@/Dispatch')).Wallet;
        wallet.walletStore2.enableWallet({
            account: new Account(getProviderForNetwork('mock'), '0xcafebabe', keypair),
            provider: getProviderForNetwork('mock'),
            enable: () => new Promise((resolve, _) => resolve('')),
            on: () => {},
            isConnected: true,
        })
    }
}
