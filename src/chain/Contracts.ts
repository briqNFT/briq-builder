import { shallowReactive } from 'vue';

import type BoxContract from './contracts/box';
import type BriqContract from './contracts/briq';
import type SetContract from './contracts/set';
import type AuctionContract from './contracts/auction';
import type ERC20Contract from './contracts/erc20';
import type OnchainAuctionContract from './contracts/auction_onchain';
import type BriqFactoryContract from './contracts/briq_factory';

import type { CHAIN_NETWORKS } from './Network';
import { APP_ENV } from '@/Meta';
import RegisterShapeValidatorContract from './contracts/register_shape_validator';

export const ADDRESSES: Record<CHAIN_NETWORKS, Record<string, string>> = {
    localhost: {},
    'starknet-testnet': {},
    'starknet-mainnet': {
        briq: '0x00247444a11a98ee7896f9dec18020808249e8aad21662f2fa00402933dce402',
        set: '0x01435498bf393da86b4733b9264a86b58a42b31f8d8b8ba309593e5c17847672',
        box: '0x01e1f972637ad02e0eed03b69304344c4253804e528e1a5dd5c26bb2f23a8139',
        booklet: '0x05faa82e2aec811d3a3b14c1f32e9bbb6c9b4fd0cd6b29a823c98c7360019aa4',
        auction: '0x01712e3e3f133b26d65a3c5aaae78e7405dfca0a3cfe725dd57c4941d9474620',
        auction_ducks: '0x00b9bb7650a88f7e375ae8d31d48b4d4f13c6c34344839837d7dae7ffcdd3df0',
        eth_bridge_contract: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
        briq_factory: '0x05b021b6743c4f420e20786baa7fb9add1d711302c267afbc171252a74687376',

        // Forward compatibility
        box_nft_sp: '0x01e1f972637ad02e0eed03b69304344c4253804e528e1a5dd5c26bb2f23a8139',
        box_nft_briqmas: '0x01e1f972637ad02e0eed03b69304344c4253804e528e1a5dd5c26bb2f23a8139',
        booklet_ducks: '0x05faa82e2aec811d3a3b14c1f32e9bbb6c9b4fd0cd6b29a823c98c7360019aa4',
        booklet_starknet_planet: '0x05faa82e2aec811d3a3b14c1f32e9bbb6c9b4fd0cd6b29a823c98c7360019aa4',
        booklet_briqmas: '0x05faa82e2aec811d3a3b14c1f32e9bbb6c9b4fd0cd6b29a823c98c7360019aa4',
        booklet_lil_ducks: '0x05faa82e2aec811d3a3b14c1f32e9bbb6c9b4fd0cd6b29a823c98c7360019aa4',
        booklet_ducks_frens: '0x05faa82e2aec811d3a3b14c1f32e9bbb6c9b4fd0cd6b29a823c98c7360019aa4',
        briq_token: '0x00247444a11a98ee7896f9dec18020808249e8aad21662f2fa00402933dce402',
        set_nft: '0x01435498bf393da86b4733b9264a86b58a42b31f8d8b8ba309593e5c17847672',
        set_nft_ducks: '0x01435498bf393da86b4733b9264a86b58a42b31f8d8b8ba309593e5c17847672',
        set_nft_sp: '0x01435498bf393da86b4733b9264a86b58a42b31f8d8b8ba309593e5c17847672',
        set_nft_briqmas: '0x01435498bf393da86b4733b9264a86b58a42b31f8d8b8ba309593e5c17847672',
        set_nft_1155_lil_ducks: '0x01435498bf393da86b4733b9264a86b58a42b31f8d8b8ba309593e5c17847672',
        set_nft_1155_ducks_frens: '0x01435498bf393da86b4733b9264a86b58a42b31f8d8b8ba309593e5c17847672',
    },
    'starknet-mainnet-dojo': {},
};

if (APP_ENV !== 'prod') {
    ADDRESSES['localhost'] = {
        briq: '0x020b2a2baa5f0c679ba7647ed803e975bb6badfe9334b5944a547ac12ef4c099',
        set: '0x03ab0330cff177e3f154cc143b46e9ddac39041ba8ce201def9e3ca8e2aa921a',
        auction: '0x05dd2d089793684e837e01dc136503721f5915af46b8096a7363bb9dbd44901c',
        eth_bridge_contract: '0x62230ea046a9a5fbc261ac77d03c8d41e5d442db2284587570ab46455fd2488',
    };
    ADDRESSES['starknet-testnet'] = {
        briq: '0x0068eb19445f96b3c3775fba757de89ee8f44fda42dc08173a501acacd97853f',
        set: '0x038bf557306ab58c7e2099036b00538b51b37bdad3b8abc31220001fb5139365',
        box: '0x043bafcb15f12c137229406f96735eba51018fe75e5330058479556bc77dfd94',
        booklet: '0x018734a90e5df97235c0ff83f92174cf6f16ad3ec572e38e2e146e47c8878839',
        auction: '0x033f840d4f7bfa20aaa128e5a69157355478d33182bea6039d55aae3ffb861e2',
        auction_ducks: '0x04ef0bd475fb101cc1b5dc2c4fc9d11b4fa233cfa1876924ec84b2f3dcf32f75',
        eth_bridge_contract: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
        briq_factory: '0x07ad96c0f03a1924ede9ce2e3e4546560602dcce65b5fd050870cfecf583b414',

        // Forward compatibility
        box_nft_sp: '0x043bafcb15f12c137229406f96735eba51018fe75e5330058479556bc77dfd94',
        box_nft_briqmas: '0x043bafcb15f12c137229406f96735eba51018fe75e5330058479556bc77dfd94',
        booklet_ducks: '0x018734a90e5df97235c0ff83f92174cf6f16ad3ec572e38e2e146e47c8878839',
        booklet_starknet_planet: '0x018734a90e5df97235c0ff83f92174cf6f16ad3ec572e38e2e146e47c8878839',
        booklet_briqmas: '0x018734a90e5df97235c0ff83f92174cf6f16ad3ec572e38e2e146e47c8878839',
        booklet_lil_ducks: '0x018734a90e5df97235c0ff83f92174cf6f16ad3ec572e38e2e146e47c8878839',
        booklet_ducks_frens: '0x018734a90e5df97235c0ff83f92174cf6f16ad3ec572e38e2e146e47c8878839',
        briq_token: '0x0068eb19445f96b3c3775fba757de89ee8f44fda42dc08173a501acacd97853f',
        set_nft: '0x038bf557306ab58c7e2099036b00538b51b37bdad3b8abc31220001fb5139365',
        set_nft_ducks: '0x038bf557306ab58c7e2099036b00538b51b37bdad3b8abc31220001fb5139365',
        set_nft_sp: '0x038bf557306ab58c7e2099036b00538b51b37bdad3b8abc31220001fb5139365',
        set_nft_briqmas: '0x038bf557306ab58c7e2099036b00538b51b37bdad3b8abc31220001fb5139365',
        set_nft_1155_lil_ducks: '0x038bf557306ab58c7e2099036b00538b51b37bdad3b8abc31220001fb5139365',
        set_nft_1155_ducks_frens: '0x038bf557306ab58c7e2099036b00538b51b37bdad3b8abc31220001fb5139365',

    };

    ADDRESSES['starknet-testnet-dojo'] = {
        world: '0x22f301bf61956fbf8a8b8a575becf148d27b22c5419f67743206a43c85372e4',
        setup_world: '0x1d92725e20d16cab47b4ad4742d3f4f70424546a55d97a7d81c60fde0d7d73b',
        attribute_groups: '0x703ca58eebb167928a48189b00cd2c2b7446d922db99e730808710197dc6175',
        register_shape_validator: '0x57698adbb293ec5ff06bf2ed8af571d0d58f684c59be373ff4a4c3785f411b0',
        migrate_assets: '0x19fd4814c4bc4046ad8dbc2b2cdbac3e43e30a01bc92f31691993229a27e4b3',

        briq_factory: '0x227a1cc8dfb791628ef60e73d2676b9a1da43b878e8d14a920ba96cec63c79c',

        box: '0x76fb0333408c9f4de5d898b1fd349b80077e8a22b2608710c1652e090f92a11', // briqmas
        booklet: '0x5c1330e30b7e08cc552baff0c9d76a68d15527671bab44936ad95bdc6c4262e', // briqmas
        briq: '0x62d33afa007607ff0eaf008280f72c1033f5a1fda176f20fc36521c80f7a1ba',
        set: '0x4b9a60a3acada4322d3348133d6bad63a6309ec40d23d093651e07a6cb28810',

        box_nft_sp: '0x1d23f59c358da797256a3ff346dcce909f4be05342ef5a4e184132945117ef',
        box_nft_briqmas: '0x76fb0333408c9f4de5d898b1fd349b80077e8a22b2608710c1652e090f92a11',
        booklet_ducks: '0x235aae7d603648452f9bb7ee71b18a9d83e1dbc9f4ed693fb4ab9409962b57a',
        booklet_starknet_planet: '0x5ce6ca596712b54cfc04b9a8d74b41b2158dcaad73f456035dbdae1b019fcb9',
        booklet_briqmas: '0x5c1330e30b7e08cc552baff0c9d76a68d15527671bab44936ad95bdc6c4262e',
        booklet_lil_ducks: '0x7294576a17089d0f8d9920ccda875ab1b60567f3009f6e2b2a598f42bef5036',
        booklet_ducks_frens: '0x70970b0319cd1b706a1ad24a158b4b44e536588eebc8972eaf0602a1db523bc',
        briq_token: '0x62d33afa007607ff0eaf008280f72c1033f5a1fda176f20fc36521c80f7a1ba',
        set_nft: '0x4b9a60a3acada4322d3348133d6bad63a6309ec40d23d093651e07a6cb28810',
        set_nft_ducks: '0x14f4eea3d6a7627c0d719cad3dbd55452833514afcbe76e299cef7ef00cb20e',
        set_nft_sp: '0x58206fa33f9aa43f8c0ee52abf390c18006f3f0d52c7c3e464e619fe2a5cfc5',
        set_nft_briqmas: '0x6ebbc1d4a154e7f86957080d19a81a85d2cd1582db03f9d401c42529453f3fa',
        set_nft_1155_lil_ducks: '0x341e9fb783afbf3d15f6377c5e18ce2fa412e39c853ab46d0c55cff40bf8dac',
        set_nft_1155_ducks_frens: '0x3eb663fec0a5ee53e88ef8222acfbc39a17e2109cefa79507d6f19e58e2710f',

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
    register_shape_validator: undefined as undefined | RegisterShapeValidatorContract,
});

export default contractStore;
