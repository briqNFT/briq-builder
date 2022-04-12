import { Args, Contract, Provider } from '@/Starknet';
import { toBN } from '@/Starknet';

/**
 * This class exists to provide some fixes for the starknet.js API for now.
 */
export default class ExtendedContract extends Contract
{
    constructor(abi: any, address: string, provider: Provider)
    {
        super(abi, address, provider)
    }
}