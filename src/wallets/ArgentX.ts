import type { Signer, Provider } from 'starknet';

type StarknetWindowObject =
  | {
      enable: () => Promise<string[]>
      signer: Signer
      provider: Provider
      selectedAddress: string,
      on: CallableFunction,
      isConnected: true,
      isPreauthorized: () => Promise<boolean>
    }
  | {
      enable: () => Promise<string[]>
      signer?: Signer
      provider: Provider
      selectedAddress?: string,
      on: CallableFunction,
      isConnected: false,
      isPreauthorized: () => Promise<boolean>
    }

import { IWallet, WalletConnectionError, WalletNotAvailable } from './IWallet'

export async function getStarknetObject()
{
    let checkObject = (resolve: any, reject: any, i = 0) => {
        if (i > 20)
            reject();
        if ((globalThis as any)?.["starknet"])
            return resolve((globalThis as any).starknet);
        setTimeout(() => {
            checkObject(resolve, reject, i + 1);
        }, 200);
    }
    return new Promise((resolve, reject) => {
        checkObject(resolve, reject);
    })
}

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

    async canEnableSilently()
    {
        let swo: StarknetWindowObject = (globalThis as any)?.["starknet"];
        if (!swo)
            return false;
        return await swo.isPreauthorized();
    }

    async enable(): Promise<[string, Provider, Signer]>
    {
        let swo: StarknetWindowObject = (globalThis as any)?.["starknet"];
        if (!swo)
            throw new WalletNotAvailable();
        await swo.enable();
        if (swo.isConnected)
            return [swo.signer!.address, swo.provider, swo.signer];
        else
            throw new WalletConnectionError();
    }

    async watchForChanges(cb: CallableFunction)
    {
        let swo: StarknetWindowObject = (globalThis as any)?.["starknet"];
        if (!swo)
            return; // shouldn't happen but meh
        swo.on("accountsChanged", cb);
    }
}