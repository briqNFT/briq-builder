import { Args, Contract, Provider, compileCalldata } from 'starknet';
import { getSelectorFromName } from 'starknet/utils/stark';
import { toBN } from 'starknet/utils/number';

/**
 * This class exists to provide some fixes for the starknet.js API for now.
 */
export default class ExtendedContract extends Contract
{
    constructor(abi: any, address: string, provider: Provider)
    {
        super(abi, address, provider)
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
    
    /**
     * Overriden to support pending block
     * TODO: once starknet.js does this natively, remove this.
     */
    override async call(method: string, args: Args = {}) {
        // ensure contract is connected
        if (this.connectedTo === null)
            throw new Error('contract isnt connected to an address')
    
        // validate method and args
        this.validateMethodAndArgs('CALL', method, args);
    
        // compile calldata
        const entrypointSelector = getSelectorFromName(method);
        const calldata = compileCalldata(args);
    
        return this.provider
          .callContract({
            contract_address: this.connectedTo,
            calldata,
            entry_point_selector: entrypointSelector,
          },
          "pending")
          .then((x) => this.parseResponse(method, x.result));
      }
}