export abstract class IWallet
{
    abstract isLikelyAvailable(): boolean;

    abstract getErrorMessage(error: Error): string;
    
    abstract enable(contractStore: any): Promise<void>;
}


export class WalletConnectionError extends Error
{
}

export class WalletNotAvailable extends WalletConnectionError
{
}
