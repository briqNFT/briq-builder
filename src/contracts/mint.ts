import { getSelectorFromName } from 'starknet/utils/stark';
import { toBN } from 'starknet/utils/number';

import { AddTransactionResponse } from 'starknet';

import { Args, Contract, Provider, Signer } from 'starknet';

import SetABI from './mint_proxy_abi.json'

export default class MintContract extends Contract
{
    constructor(address: string, provider: Provider)
    {
        super(SetABI, address, provider)
    }

    override private parseResponse(method: string, response: (string | string[])[]): Args {
        const methodAbi = this.abi.find((abi) => abi.name === method)!;
        let out: Args = {};
        for (let i = 0; i < response.length; ++i)
        {
            let outputAbi = methodAbi.outputs[i];
            if (outputAbi.name.endsWith("_len") && outputAbi.type === "felt" && i + 1 < methodAbi.outputs.length)
            {
                if (methodAbi.outputs[i+1].type === "felt*" && methodAbi.outputs[i+1].name + "_len" === outputAbi.name)
                {
                    out[methodAbi.outputs[i+1].name] = response.slice(i + 1, i + 1 + toBN(response[i] as string).toNumber()) as string[];
                    i += 1 + toBN(response[i]).toNumber();
                }
            }
            else
            {
                out[outputAbi.name] = response[i];
            }
        }
        return out;
    }

    async has_minted(user: string): boolean
    {
        return !!parseInt((await this.call("has_minted", { user })).res, 16);
    }

    async mint(user: string)
    {
        if (!((this.provider as Signer).address))
            throw new Error("Provider is not a signer");
        return await this.invoke("mint", { user });
    }
}