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
    // # World  Contract address: 0x224ad60c7cac93cc53ac324b2c6289a335a1f914e009344520b7bea5cba7195
    // setup_world  Already deployed: 0x4cadc6ed170e1b860bbac104c9d470f215f95cea566fd36802c8d6684565cc6
    // briq_factory  Already deployed: 0x59152f8e204f008814c1cf5472e91ba53a723ebbd3c62a415f6571a35724abd
    // attribute_groups  Already deployed: 0x485f6c389bd22d266e90395b5f145b59044db43915d130e440b9eaedd51af82
    // register_shape_validator  Already deployed: 0x8230683598be99d4f87ca0d525aaaa32281394e05a56d2282e6e853729a3a1
    // box_nft  Already deployed: 0x317fb0ae04fb8eae8bd032bf7c217bcef7e2a152ea89e17a08e21537a75d7e0
    // booklet_ducks  Already deployed: 0x10c306b71a6a938ae6e06e5c727108b19a092a02b9eac3940dccf7e1732594c
    // booklet_starknet_planet  Already deployed: 0x2ff89b2a217d175cbce0d6ea286e529a2464aa3bd20d5fb68b6e378b77741f8
    // briq_token  Already deployed: 0x1d1b0fea4ed52bc6459a537ffd687a98bce5dcb33491294ef79b6d13a4ff20b
    // set_nft  Already deployed: 0x704f5c989fc68cd845125ff378b6fe42679477a26de68a03ac8cbe5fc4dea47
    // set_nft_ducks  Already deployed: 0x625a0eed8bd3817523d09fbd48a5d92ba0623cd65f6dad3b4570f7102c95829
    // set_nft_1155  Already deployed: 0x1e0dbbb73af3380ffae2ea598c7d6a80f3d417da3c13ba5df1b3a6fd1d1aa85
    ADDRESSES['starknet-testnet-dojo'] = {
        world: '0x472f425f84a736a4fb59e9aa7d8c2f664a04b91e36b92230db93abb0566cb7b',
        attribute_groups: '0x1cfb9fb8bb15bb338ae7074360a35b1994c8bc93648a44db5433da424d03805',
        briq_factory: '0x15e6c5cf2766fdf71494359389ad710ab79f597833200a887c4ae6948e123b0',
        briq: '0x16dffb1ef41055a45e37c9f4189cc2748141c81cf2ca1f5f929d9ae727d67e8',
        set: '0x30d94b5cad19b465667f1f7298c747be883b1ba6db9ed7f4d8e20ebaf336bc8',
        set_briqmas: '0x4661b144606e0dff664a8a3f98b999b48b51c959c3ce484bff3e4b728102526',
        box: '0x150915cb2822785ff97ddab53b5d7fa05cd2522e41963f67a772c110b72aa23', // briqmas
        booklet: '0x20943fb1e326d8ac6575568e4384ffd4720e17835ec6d31c82ba3131cb0f9aa', // briqmas
        register_shape_validator: '0x281014b413b61ad5b66dad574a6554d83b14c1475097070988aadae0ee5580c',
        auction: '',
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
