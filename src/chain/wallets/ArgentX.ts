import type { Signer, Provider, AccountInterface } from 'starknet';
import { getSelectorFromName } from 'starknet/utils/hash';

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

const proxyProvider = function(provider: any) {
    return new Proxy(provider, {
        get(target, key)
        {
            if (key === "callContract")
            {
                return async (...args) =>  {
                    let wrapped_args = {
                        contract_address: args[0].contractAddress,
                        entry_point_selector: getSelectorFromName(args[0].entrypoint),
                        calldata: args[0].calldata,
                    }
                    return await target.callContract(wrapped_args);
                }
            }
            return Reflect.get(target, key);
        }
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

    async enable(): Promise<[string, Provider, AccountInterface]>
    {
        let swo: StarknetWindowObject = (globalThis as any)?.["starknet"];
        if (!swo)
            throw new WalletNotAvailable();
        await swo.enable();
        if (swo.isConnected)
        {
            if (swo.account) // Argent 3
                return [swo.signer!.address, swo.provider, swo.account];
            else // Argent 2
                return [swo.signer!.address, proxyProvider(swo.provider), proxyProvider(swo.signer)];
        }
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