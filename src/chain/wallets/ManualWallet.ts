import { IWallet } from './IWallet'

export default class ArgentXWallet extends IWallet
{
    isLikelyAvailable(): boolean
    {
        return true;
    }

    getErrorMessage(error: Error): string
    {
        return error?.toString();
    }
    
    async enable(contractStore: any): Promise<void>
    {
        throw new Error("Not implemented");
    }
}
