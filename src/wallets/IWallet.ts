import type { Store } from 'vuex';
import type { Provider, Signer } from 'starknet';

export abstract class IWallet
{
    abstract isLikelyAvailable(): boolean;

    abstract getErrorMessage(error: Error): string;
    
    /**
     * Enable the wallet
     * Returns the user address & a valid signer & provider.
     */
    abstract enable(): Promise<[string, Provider, Signer]>;
}

export class WalletConnectionError extends Error
{
}

export class WalletNotAvailable extends WalletConnectionError
{
}
