import type { Signer, Provider } from 'starknet';

type StarknetWindowObject =
  | {
      enable: () => Promise<string[]>
      signer: Signer
      provider: Provider
      selectedAddress: string
      isConnected: true
    }
  | {
      enable: () => Promise<string[]>
      signer?: Signer
      provider: Provider
      selectedAddress?: string
      isConnected: false
    }

import type { Store } from 'vuex';
import { IWallet, WalletNotAvailable } from './IWallet'

export default class ArgentXWallet extends IWallet
{
    isLikelyAvailable(): boolean
    {
        if (!(globalThis as any)?.["starknet"])
            return false;
        return true;
    }

    getErrorMessage(error: Error): string
    {
        if (error instanceof WalletNotAvailable)
            return "ArgentX Wallet extension is not installed or not available";
        return error?.toString();
    }

    async enable(store: Store<unknown>): Promise<void>
    {
        let swo: StarknetWindowObject = (globalThis as any)?.["starknet"];
        if (!swo)
            throw new WalletNotAvailable();
        await swo.enable();
        if (swo.isConnected)
        {
            store.dispatch("wallet/connect", {
                userWalletAddress: swo.signer!.address,
                signer: swo.signer!,
            })
        }
        else
            throw new Error("Could not connect to ArgentX wallet");
    }
}