import type { Store } from 'vuex';

export abstract class IWallet
{
    abstract isLikelyAvailable(): boolean;

    abstract getErrorMessage(error: Error): string;
    
    abstract enable(store: Store<unknown>): Promise<void>;
}

export class WalletConnectionError extends Error
{
}

export class WalletNotAvailable extends WalletConnectionError
{
}
