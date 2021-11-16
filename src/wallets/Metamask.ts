import { IWallet } from './IWallet'

export default class MetamaskWallet extends IWallet
{
    isLikelyAvailable(): boolean
    {
        return false;
    }

    getErrorMessage(error: Error): string
    {
        return "Metamask is currently not available on starkware.";
    }
    
    async enable(contractStore: any): Promise<void>
    {
        throw new Error("Not implemented");
    }
}
