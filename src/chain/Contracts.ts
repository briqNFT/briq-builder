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
        briq: '',
        set: '',
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
        briq: '0x0206a3d41d18e634f1492621dc42144c7dce52530bc90150fe8bcddef7011b4d',
        set: '0x074fe9c7050d647cb80b5a993c6f532c0150734a69ebe1973c75916a6d808e54',
        box: '0x041b4b40491788813ba1c830c8e0e7e97b10a604d9dce25259f50352e7ad8b09',
        booklet: '0x010c5fc9e7ebafe1bb260aa28f23ab93295b59ca5e1e7875c35338968c5a4233',
        auction: '0x0344c97a38c9b5f632e0f1de386402ff0e3ebcf6878a65f588aa4375f9750c00',
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
