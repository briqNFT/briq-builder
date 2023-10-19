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
    };

    ADDRESSES['starknet-testnet-dojo'] = {
        world: '0x5e62f46f103f8009b4f12925c92407b3121206abaca5f43248350533bfdb40b',
        setup_world: '0x74a07a80dec968f55bbfbf006deb4b6fe3493c51ae42c6cd588fb6e5431800b',
        attribute_groups: '0x5e03fffff04a383414aede1dda95c33cff3ac8d44e19811ff634896dc931cf1',
        register_shape_validator: '0x376685547c2237ff271bd241ab8d2bd6f168514cb45a969b7271d7cd3fdced9',

        briq_factory: '0x24081ab73c27537806ce23d93b40befd8946bdede1f031298a032ccb2b74d96',

        box: '0x10fda9480706cef65c9d7eb90a2ce32751ac80898fc826cc74e6331b781992a', // briqmas
        booklet: '0x761a05da11813527b02f503000b74c0e83743e1f836111ca987772a19fca3bb', // briqmas
        briq: '0x3fc9bfbf5e373f5bf52b1c895885c85de76863772511c467df882ca44826962',
        set: '0x34fcb874cbc85d0a6f8c473d433e9ebd0bccfa76ad75232945a1f0115b62ba1',

        box_nft_sp: '0x6e10789a603f768da43d9797dc97fc53ad4c3b52db504ff102be232aa8eb527',
        box_nft_briqmas: '0x10fda9480706cef65c9d7eb90a2ce32751ac80898fc826cc74e6331b781992a',
        booklet_ducks: '0x748f4162442c60a6e228503e078ff8b003f331695bffda99c74e5a7bc235656',
        booklet_starknet_planet: '0x4e549e6a2e8401909ab03d20c9a6fbef4613a1354b74b0e52cf80fc4cdcc2e6',
        booklet_briqmas: '0x761a05da11813527b02f503000b74c0e83743e1f836111ca987772a19fca3bb',
        booklet_lil_ducks: '0x34b7c0de8199f5acc07fe3b95e009750ee32de6f341251e46a448210d4e700a',
        booklet_frens_ducks: '0x22a626c03cb1320e31ed4deaa174088419697bf44f4e1fe2d7e1ecc61e1d607',
        briq_token: '0x3fc9bfbf5e373f5bf52b1c895885c85de76863772511c467df882ca44826962',
        set_nft: '0x34fcb874cbc85d0a6f8c473d433e9ebd0bccfa76ad75232945a1f0115b62ba1',
        set_nft_ducks: '0x765fca82c4690a15c8c33985b7045ec8f8fdd1a7cba231a1c5f3a9c9767adc8',
        set_nft_sp: '0x30e11394a3c0e2fd712b0bd161027c49d96df1a010693c3f2794428b0b03df9',
        set_nft_briqmas: '0x774c404feeb97675c47145140a0f8d92c70f02d52a4aa640c11064f1d9380a3',
        set_nft_1155_lil_ducks: '0x2f888a745a97123db6265a1db9f09a47d59f47e223dd272a3223e652bde806a',
        set_nft_1155_frens_ducks: '0x4f72b6668def25e048f8877e4d200602dd90d10cb1bedfba5758a67e3c7da13',

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
