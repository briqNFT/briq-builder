import type { Provider, AccountInterface } from '@/Starknet';

import MintABI from './testnet/mint.json'
import ExtendedContract from './Abstraction';

export default class MintContract
{
    contract: ExtendedContract;
    constructor(address: string, provider: Provider)
    {
        this.contract = new ExtendedContract(MintABI, address, provider);
    }

    getAddress() {
        return this.contract.address;
    }

    async has_minted(user: string): Promise<boolean>
    {
        try {
            return parseInt((await this.contract.amountMinted(user))) > 0;
        } catch(err) {
            throw err;
        }
    }

    async mint(user: string)
    {
        return await this.contract.mint(user);
    }
}