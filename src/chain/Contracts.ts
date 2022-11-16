import { shallowReactive } from 'vue';

import type BoxContract from './contracts/box';
import type BriqContract from './contracts/briq';
import type SetContract from './contracts/set';
import type AuctionContract from './contracts/auction';
import type ERC20Contract from './contracts/erc20';
import { DEV } from '@/Meta';
import type { CHAIN_NETWORKS } from './Network';

export const ADDRESSES: Record<CHAIN_NETWORKS, Record<string, string>> = {
    mock: {
        briq: '0xA',
        set: '0xB',
        box: '0xD',
    },
    localhost: {},
    'starknet-testnet': {},
    'starknet-testnet-legacy': {},
    'starknet-mainnet': {
        briq: '0x05a7b65fa39929e3816d75640415aaa2ffed2020da83515ad9eeb9a2a07de195',
        set: '0x06498184048f5a971cdd8868910d5ae9c1cbe7dee9d8887e43e5236ae79a21b4',
        box: '0x05f1760600412b3e6a26322ebdb0d269a3c54a0e01face2251d97a23af695c8d',
        booklet: '0x03652aa641585bac21f641bdd445399e45e6a334dcf77eb16bd7e158563cf6d5',
        auction: '0x069af7b4be9a993bcf07a83ce501d93514da0b02f90b0b3b62441a168df1ec57',
        eth_bridge_contract: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
    },
};

if (DEV) {
    ADDRESSES['localhost'] = {
        briq: '0x020b2a2baa5f0c679ba7647ed803e975bb6badfe9334b5944a547ac12ef4c099',
        set: '0x03ab0330cff177e3f154cc143b46e9ddac39041ba8ce201def9e3ca8e2aa921a',
        auction: '0x05dd2d089793684e837e01dc136503721f5915af46b8096a7363bb9dbd44901c',
        eth_bridge_contract: '0x62230ea046a9a5fbc261ac77d03c8d41e5d442db2284587570ab46455fd2488',
    };
    ADDRESSES['starknet-testnet'] = {
        briq: '0x029e1fb93825a116daf88902c8bbf1a386890e6a5cf7906b584a1e70e7023e28',
        set: '0x065ee60db9e38ecdf4afb9e070466b81984ffbcd06bc8650b1a21133310255c8',
        box: '0x0799b964cd6a32611fbd589ebae040ad18715ae5cd9b1a42226bb0b1db48c631',
        booklet: '0x048891a90426d468603732453afa919f280a3bc61a9ef246519eec87760aad76',
        auction: '0x006fbea980d2acb5c63ad97637f6d7f3fa18887e3ad987abbd9eb594a58c0291',
        eth_bridge_contract: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
    };
}

const contractStore = shallowReactive({
    briq: undefined as undefined | BriqContract,
    set: undefined as undefined | SetContract,
    box: undefined as undefined | BoxContract,
    auction: undefined as undefined | AuctionContract,
    eth_bridge_contract: undefined as undefined | ERC20Contract,
});

export default contractStore;
