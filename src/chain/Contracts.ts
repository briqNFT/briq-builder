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
        set_nft: '0x043bafcb15f12c137229406f96735eba51018fe75e5330058479556bc77dfd94',
        set_nft_ducks: '0x043bafcb15f12c137229406f96735eba51018fe75e5330058479556bc77dfd94',
        set_nft_sp: '0x043bafcb15f12c137229406f96735eba51018fe75e5330058479556bc77dfd94',
        set_nft_briqmas: '0x043bafcb15f12c137229406f96735eba51018fe75e5330058479556bc77dfd94',
        set_nft_1155_lil_ducks: '0x043bafcb15f12c137229406f96735eba51018fe75e5330058479556bc77dfd94',
        set_nft_1155_ducks_frens: '0x043bafcb15f12c137229406f96735eba51018fe75e5330058479556bc77dfd94',

    };

    ADDRESSES['starknet-testnet-dojo'] = {
        world: '0x7e4b18f979ebdc9cf30f929bc8199239005832eb9eed2134667bed628c23d4',
        setup_world: '0x1db42603f55f5e92e7f1a2a5ee3213a9a79edc32037f57903f1cf064c126236',
        attribute_groups: '0x32752b585c5debf79889c30f282ef13d916449dc04d6e8a958b3215a87fcd9e',
        register_shape_validator: '0x664296a70c193451670628d4e563ec53eae2515731bb06ebe5241455d31fd07',
        migrate_assets: '0x30e53c44983f6998732095bd61fa998e9008cd479ccc08ea553dfcae86f4880',

        briq_factory: '0x651a5b09f83dd7645c406763c4c32f0a369ad4f14729ee3cfd02b4a99fc8363',

        box: '0x6baff254582bd7750600b762729bd44b7dea781b17804fb5a529874e3f6d5fb', // briqmas
        booklet: '0x5cce2521148759a6f605e7c7661c9d0441162bbe076cdef8385b3718e6c9afb', // briqmas
        briq: '0x67e44efc5d1868fde5ff9604b44c3cef2d77dc00e785f6d2c4519c248c8bdf2',
        set: '0x16a1e2799d18948eeb8d153180169d3ebbd964958ff338d9446fd5834f18836',

        box_nft_sp: '0xd9bfa6936fdd84593a3920937fc556c67c16da8d3d3663f6af299365cc3b10',
        box_nft_briqmas: '0x6baff254582bd7750600b762729bd44b7dea781b17804fb5a529874e3f6d5fb',
        booklet_ducks: '0x53a545137759dc4d969b9816e809a7f9d89f0e86ad96d7277b33c724b466fa9',
        booklet_starknet_planet: '0x4104a0f65e62cce969e9adf103277c2b2681a731bca790f7d04c921488d2ec1',
        booklet_briqmas: '0x5cce2521148759a6f605e7c7661c9d0441162bbe076cdef8385b3718e6c9afb',
        booklet_lil_ducks: '0x1f582e9ee9f862caccaee12c181740e6f1fe8800df30c8b0c5ca14ef4651c59',
        booklet_ducks_frens: '0x55afbd1c3b5e29891cffed94edd86fc60e044e89d9b329a1d31035e160058cb',
        briq_token: '0x67e44efc5d1868fde5ff9604b44c3cef2d77dc00e785f6d2c4519c248c8bdf2',
        set_nft: '0x16a1e2799d18948eeb8d153180169d3ebbd964958ff338d9446fd5834f18836',
        set_nft_ducks: '0x112c60e1c47f74e3328f9ca0678519de2f962de678bafb3f37c5d5a2e05a58e',
        set_nft_sp: '0x49fbdb572e1b1bc24db67bb9205329227daa838039e344dd33ae91af76812e7',
        set_nft_briqmas: '0x69710c8ee4465f4ea29636bc741224a2ec9456191c88ca52d1a04bc413efafb',
        set_nft_1155_lil_ducks: '0x4499ce1604e2432e26779b97ca6e56250bb612103e3f13233f25dbecabf13f7',
        set_nft_1155_ducks_frens: '0x7645accafb7d12f07dcc7abca241f3afbaefc9300aca5ca90b85ea6db50cfe3',

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
