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
    'starknet-mainnet-dojo': {
        eth_bridge_contract: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',

        world: '0x1ea16366a82e211a9b9045725309a5080c0260d5caf45c58836fc61b42501f5',
        setup_world: '0x2b07055a0545c2dd1f18adef3c54bdf7d2235571698c8846cf83532a87ba3a0',
        attribute_groups: '0x3b85ace5bcb097c42accd00909d35944025c20168e5c4f485808f6c468009c7',
        register_shape_validator: '0x4222c0d72c977ee938ecb4611ef24fb025eb7c460b50c29858f11eb4df03065',
        migrate_assets: '0x5a378904f3a2a93e988f54173e9ed289f7612b1d39dc109c4321367fbd0f945',

        briq_factory: '0x3374d4a1b4f8dc87bd680ddbd4f1181b3ec3cf5a8ef803bc4351603b063314f',

        box: '0x69699ce808b5459a3b652b5378f8c141e1dc79e10f4e7b486439fd989b7dfb1', // briqmas
        booklet: '0x4bbb2000c80ff79c2aa3b8aa83ee69c103469181a19d01d7f3ee4313a8031', // briqmas
        briq: '0x2417eb26d02947416ed0e9d99c7a023e3565fc895ee21a0a0ef88a524a665d6',
        set: '0x3f96949d14c65ec10e7544d93f298d0cb07c498ecb733774f1d4b2adf3ffb23',

        box_nft_sp: '0x73e3b5e6c7924f752a158c2b07f606bd5b885029da0ac1e3cde254985303f50',
        box_nft_briqmas: '0x69699ce808b5459a3b652b5378f8c141e1dc79e10f4e7b486439fd989b7dfb1',
        booklet_ducks: '0x3311cdef78f70c1b13568e6dabda043c5e9d2736c0c02a35aa906d91d69836b',
        booklet_starknet_planet: '0x2fd50e1bdd7400a8fc97eb63aa4f3423a7ec72ebe78d413ce410ec60a35afea',
        booklet_briqmas: '0x4bbb2000c80ff79c2aa3b8aa83ee69c103469181a19d01d7f3ee4313a8031',
        booklet_ducks_frens: '0x35d3f5be7b3b06a2d02a539faecd45bf4a04644aee7290359bd595047929a92',
        booklet_lil_ducks: '',
        briq_token: '0x2417eb26d02947416ed0e9d99c7a023e3565fc895ee21a0a0ef88a524a665d6',
        set_nft: '0x3f96949d14c65ec10e7544d93f298d0cb07c498ecb733774f1d4b2adf3ffb23',
        set_nft_ducks: '0x4fa864a706e3403fd17ac8df307f22eafa21b778b73353abf69a622e47a2003',
        set_nft_sp: '0xe9b982bdcbed7fa60e5bbf733249ff58da9fe935067656e8175d694162df3',
        set_nft_briqmas: '0x12a6eeb4a3eecaf16667e2b630963a4c215cdf3715fb271370a02ed6e8c1942',
        set_nft_1155_ducks_frens: '0x433a83c97c083470a1e2f47e24cbc53c4a225f69ffc045580a7279e7f077c79',
        set_nft_1155_lil_ducks: '',
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
        set_nft: '0x038bf557306ab58c7e2099036b00538b51b37bdad3b8abc31220001fb5139365',
        set_nft_ducks: '0x038bf557306ab58c7e2099036b00538b51b37bdad3b8abc31220001fb5139365',
        set_nft_sp: '0x038bf557306ab58c7e2099036b00538b51b37bdad3b8abc31220001fb5139365',
        set_nft_briqmas: '0x038bf557306ab58c7e2099036b00538b51b37bdad3b8abc31220001fb5139365',
        set_nft_1155_lil_ducks: '0x038bf557306ab58c7e2099036b00538b51b37bdad3b8abc31220001fb5139365',
        set_nft_1155_ducks_frens: '0x038bf557306ab58c7e2099036b00538b51b37bdad3b8abc31220001fb5139365',

    };

    ADDRESSES['starknet-testnet-dojo'] = {
        eth_bridge_contract: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',

        world: '0x1cf3f63efa8ccb10fab0e9b3a1a72b69071005978b6977150eb1221235892d3',
        setup_world: '0x2f9f1470f9a07b39a44ffc45358bbecaa01c589e8430ea6fa351c9b3057221',
        attribute_groups: '0x3939c876e6497d2af4948ea2e2b70ea143ba4d7e71b1254f5b1582c1fcf2751',
        register_shape_validator: '0x412497d1bf0dfefdca362494c58f287e495a07249783e29775ce3020e275f6f',
        migrate_assets: '0x901e1c2a6596d3f3992c3617aa2da2017f3d980ccd4cdea0e45854452107b4',

        briq_factory: '0x7679e15068cc0d308ff270d340862d52362b1d0f9833f14d829d8e7f39d366f',

        box: '0x222e344352c9b757c002a83ce87484284a50924fb3014040740bc6e171242a0', // briqmas
        booklet: '0x6b05f3548418c462262d6e4b9ec9f2835b4b8aacc0736e5c3cd152abb811fe6', // briqmas
        briq: '0x78af24bd385d041ad87df067908dc6710baac4c7eed5e1cb3bc0ca28a7e1d1d',
        set: '0x515428b8c0b1524f370d298998bb0c8681f745dbb7ebcb57934f5575beb5252',

        box_nft_sp: '0x32ccbf4f8832f75e4484602d624ba2d43780f480cb6c3ca6c4cb9ead398a0fd',
        box_nft_briqmas: '0x222e344352c9b757c002a83ce87484284a50924fb3014040740bc6e171242a0',
        booklet_ducks: '0x161f7d29180fbce59ed7e73edd1a2ea3268c9aff22335cbbd856bfbcf84445d',
        booklet_starknet_planet: '0x32b0abe087c2e30c34b64944250dafcabf7642f3a82cff9ea52fd6f86aa212c',
        booklet_briqmas: '0x6b05f3548418c462262d6e4b9ec9f2835b4b8aacc0736e5c3cd152abb811fe6',
        booklet_ducks_frens: '0x3d3fdccf11997bb97b75d5f1818318f9648043bb4dba7b82a78ed57d67d9eac',
        booklet_lil_ducks: '',
        briq_token: '0x78af24bd385d041ad87df067908dc6710baac4c7eed5e1cb3bc0ca28a7e1d1d',
        set_nft: '0x515428b8c0b1524f370d298998bb0c8681f745dbb7ebcb57934f5575beb5252',
        set_nft_ducks: '0x611ed988cd95e6c59f31b5fafd1fcd2194b77bf8421c44112a280f6bbe4f943',
        set_nft_sp: '0x67e94f5fb9bf932e0d1ca38c4fadd4734b549ae7332eae93ab81646c3261c7b',
        set_nft_briqmas: '0x695f67f607c255194c29eaa584a9098636f961708cdaf4f1a1707d7c431dc7f',
        set_nft_1155_ducks_frens: '0x12555f235252050fa12d49393b7975afb91746fc80318ab3511b8577c8dfb97',
        set_nft_1155_lil_ducks: '',
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
