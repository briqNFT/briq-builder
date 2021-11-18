import { getSelectorFromName } from 'starknet/utils/stark';
import { toBN } from 'starknet/utils/number';

import { contractStore } from '../Wallet'
import { AddTransactionResponse } from 'starknet';

import { Args, Contract, Provider, Signer } from 'starknet';

import BriqABI from './briq_abi.json'

export default class BriqContract extends Contract
{
    constructor(address: string, provider: Provider)
    {
        super(BriqABI, address, provider)
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

    async get_all_tokens_for_owner(owner: string)
    {
        return await this.call("get_all_tokens_for_owner", { owner: owner });
    }

    async mint_multiple(material: number, token_start: number, nb: number): Promise<AddTransactionResponse>
    {
        return await this.invoke("mint_multiple", { owner: (this.provider as Signer).address, material: "" + material, token_start: "" + token_start, nb: "" + nb });
    }
}