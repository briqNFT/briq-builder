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

    /**
     * Called by the wallet store to watch for e.g. account changes.
     * @param cb The callback to call whenever something relevant changes.
     */
    abstract watchForChanges(cb: CallableFunction): void;
}

export class WalletConnectionError extends Error
{
}

export class WalletNotAvailable extends WalletConnectionError
{
}
