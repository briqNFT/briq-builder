import { shallowReactive } from 'vue';

import type BoxContract from './contracts/box';
import type BriqContract from './contracts/briq';
import type SetContract from './contracts/set';
import type AuctionContract from './contracts/auction';
import type ERC20Contract from './contracts/erc20';
import type OnchainAuctionContract from './contracts/auction_onchain';
import type BriqFactoryContract from './contracts/briq_factory';

import type { CHAIN_NETWORKS } from './Network';
import { APP_ENV, DEV } from '@/Meta';

export const ADDRESSES: Record<CHAIN_NETWORKS, Record<string, string>> = {
    mock: {
        briq: '0xA',
        set: '0xB',
        box: '0xD',
    },
    localhost: {},
    'starknet-testnet': {},
    'starknet-testnet2': {},
    'starknet-testnet-legacy': {},
    'starknet-mainnet': {
        briq: '0x00247444a11a98ee7896f9dec18020808249e8aad21662f2fa00402933dce402',
        set: '0x01435498bf393da86b4733b9264a86b58a42b31f8d8b8ba309593e5c17847672',
        box: '0x01e1f972637ad02e0eed03b69304344c4253804e528e1a5dd5c26bb2f23a8139',
        booklet: '0x05faa82e2aec811d3a3b14c1f32e9bbb6c9b4fd0cd6b29a823c98c7360019aa4',
        auction: '0x01712e3e3f133b26d65a3c5aaae78e7405dfca0a3cfe725dd57c4941d9474620',
        auction_ducks: '0x00b9bb7650a88f7e375ae8d31d48b4d4f13c6c34344839837d7dae7ffcdd3df0',
        eth_bridge_contract: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
    },
};

if (APP_ENV !== 'prod') {
    ADDRESSES['localhost'] = {
        briq: '0x020b2a2baa5f0c679ba7647ed803e975bb6badfe9334b5944a547ac12ef4c099',
        set: '0x03ab0330cff177e3f154cc143b46e9ddac39041ba8ce201def9e3ca8e2aa921a',
        auction: '0x05dd2d089793684e837e01dc136503721f5915af46b8096a7363bb9dbd44901c',
        eth_bridge_contract: '0x62230ea046a9a5fbc261ac77d03c8d41e5d442db2284587570ab46455fd2488',
    };
    ADDRESSES['starknet-testnet'] = {
        briq: '0x06f18ebcc76b6bd3560da141aeae53f9af3d80c2001415c963ecddbba4e8ba12',
        set: '0x05f9e1c4975b0f71f0b1af2b837166d321af1cdba5c30c09b0d4822b493f1347',
        box: '0x003b51e657e236e7085d1006e8ae6f955f09793b7f6dbdfad7a1a8abadad464a',
        booklet: '0x05646ae11383a9994f958ee9cb29b3cf720b994733100ef7b8a00d6adcbe1c42',
        auction: '0x033f840d4f7bfa20aaa128e5a69157355478d33182bea6039d55aae3ffb861e2',
        auction_ducks: '0x04ef0bd475fb101cc1b5dc2c4fc9d11b4fa233cfa1876924ec84b2f3dcf32f75',
        eth_bridge_contract: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
        briq_factory: '0x0011ff172f1a9f3af71e77ef67036e81dcdb4c4d294d74bf5440d0d4c6ae61b7',
    };
    ADDRESSES['starknet-testnet2'] = {
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
    auction_ducks: undefined as undefined | OnchainAuctionContract,
    eth_bridge_contract: undefined as undefined | ERC20Contract,
    briq_factory: undefined as undefined | BriqFactoryContract,
});

export default contractStore;
