import SetContract, { SetOnDojoContract } from './set';
import { Signer } from 'starknet';
import * as starknet from 'starknet';

describe('Test Export', () => {
    it('should compute token ID correctly', () => {
        const contract = new SetContract('0xcafe', new Signer());

        expect(contract.precomputeTokenId('0xcafe', '0x12345')).toEqual(
            '0xe02664d2ab0abed66282e0541f19cffdf2025e3a2ef4ddc000000000000000',
        );
        expect(contract.precomputeTokenId('0xfade', '0x54321')).toEqual(
            '0xca75144c4b4508031da7b0dc55bcffa6566faf2e2024c85800000000000000',
        );
        expect(contract.precomputeTokenId('0xbebe', '0x22222')).toEqual(
            '0x35c677db16257dbcf928f3ff055845149075c11087633d67800000000000000',
        );
    });

    it('should compute felt arrays from strings correctly', () => {
        const contract = new SetContract('0xcafe', new Signer());
        expect(contract._string_to_felt_string('')).toEqual([]);
        expect(contract._string_to_felt_string('short string')).toEqual(['0x73686f727420737472696e67']);
        expect(contract._string_to_felt_string('shorter strings')).toEqual(['0x73686f7274657220737472696e6773']);
        expect(contract._string_to_felt_string('this is a name too long for cool')).toEqual(['0x746869732069732061206e616d6520','0x746f6f206c6f6e6720666f7220636f','0x6f6c']);
        expect(contract._string_to_felt_string('Chinese text: 有中、英文版本，也有繁、簡體版，可通過每頁左上角的連結隨時調整。')).toEqual([
            '0x4368696e65736520746578743a20e6',
            '0x9c89e4b8ade38081e88bb1e69687e7',
            '0x8988e69cacefbc8ce4b99fe69c89e7',
            '0xb981e38081e7b0a1e9ab94e78988ef',
            '0xbc8ce58fafe9809ae9818ee6af8fe9',
            '0xa081e5b7a6e4b88ae8a792e79a84e9',
            '0x80a3e7b590e99aa8e69982e8aabfe6',
            '0x95b4e38082',
        ]);
        expect(contract._string_to_felt_string('utf-8: 😅🐗 ᚻ᛫ᛗᚪᚾᚾᚪ᛫ᚷᛖᚻᚹᛦᛚᚳ᛫ᛗᛁᚳᛚᚢᚾ᛫ᚻᛦᛏ᛫')).toEqual([
            '0x7574662d383a20f09f9885f09f9097',
            '0x20e19abbe19babe19b97e19aaae19a',
            '0xbee19abee19aaae19babe19ab7e19b',
            '0x96e19abbe19ab9e19ba6e19b9ae19a',
            '0xb3e19babe19b97e19b81e19ab3e19b',
            '0x9ae19aa2e19abee19babe19abbe19b',
            '0xa6e19b8fe19bab',
        ]);
    })
});

describe('Test Export with booklet', () => {
    it('should compute compressed shape items correctly', () => {
        const contract = new SetContract('0xcafe', new Signer());

        expect(contract._compress_shape_item({ data: { material: '0x24', color: '#faafaa' }, pos: [1, 2, 3],
        })).toEqual([starknet.number.toBN('0x236661616661610000000000000000000000000000000024').toString(10), starknet.number.toBN('0x800000000000000180000000000000028000000000000003').toString(10)])

        expect(contract._compress_shape_item({ data: { material: '0x242424', color: '#faafaa' }, pos: [1, -20000, 3],
        })).toEqual([starknet.number.toBN('0x236661616661610000000000000000000000000000242424').toString(10), starknet.number.toBN('0x80000000000000017fffffffffffb1e08000000000000003').toString(10)])

        expect(contract._compress_shape_item({ data: { material: '0x24', color: '#faafaa' }, pos: [1, 2, -3],
        })).toEqual([starknet.number.toBN('0x236661616661610000000000000000000000000000000024').toString(10), starknet.number.toBN('0x800000000000000180000000000000027ffffffffffffffd').toString(10)])

        expect(contract._compress_shape_item({ data: { material: '0x24', color: '#afafaf' }, pos: [-1, 2, 3],
        })).toEqual([starknet.number.toBN('0x236166616661660000000000000000000000000000000024').toString(10), starknet.number.toBN('0x7fffffffffffffff80000000000000028000000000000003').toString(10)])

        expect(contract._compress_shape_item({ data: { material: '0x24994', color: '#347873' }, pos: [1, 2, 3000000],
        })).toEqual([starknet.number.toBN('0x233334373837330000000000000000000000000000024994').toString(10), starknet.number.toBN('0x8000000000000001800000000000000280000000002dc6c0').toString(10)])
    });
});

describe('Test new token ID computations', () => {
    it('should compute token ID correctly', () => {
        const contract = new SetOnDojoContract('0xcafe', undefined as any, { world: 0, executor: 1 } as any);

        expect(contract.precomputeTokenId('0x3ef5b02bcc5d30f3f0d35d55f365e6388fe9501eca216cb1596940bf41083e2', '0x6111956b2a0842138b2df81a3e6e88f8', 25)).toEqual(
            '0xc40763dbee89f284bf9215e353171229b4cbc645fa8c0932cb68c134ba8b24',
        );
        expect(contract.precomputeTokenId('0x3ef5b02bcc5d30f3f0d35d55f365e6388fe9501eca216cb1596940bf41083e2', '0x6111956b2a0842138b2df81a3e6e88f8', 25)).toEqual(
            '0xc40763dbee89f284bf9215e353171229b4cbc645fa8c0932cb68c134ba8b24',
        );
        expect(contract.precomputeTokenId('0x3ef5b02bcc5d30f3f0d35d55f365eca216cb1596940bf41083e2', '0x6111956b2a06e88f8', 1)).toEqual(
            '0x3011789e95d63923025646fcbf5230513b8b347ff1371b871a996861def1621',
        );
        expect(contract.precomputeTokenId('0x3ef5b02bcc5d305f365e6388fe9501eca216cb1596940bf41083e2', '0x611195842138b2df81a3e6e88f8', 2)).toEqual(
            '0x19d7b6f61cec829e2e1c424e11b40c8198912a71d75b14a781db838df69daa5',
        );
        expect(contract.precomputeTokenId('0x3ef5b02bcc5d30f3f0d35d55f365e63801eca216cb1596940bf41083e2', '0x6111956b42138b2df81a3e6e88f8', 3)).toEqual(
            '0x7805905ca794dd2afcf54520b89b0a5520f51614e3ce357c7c285279f874b29',
        );
        expect(contract.precomputeTokenId('0x3ef5b02bcc5d30f3f35d55f365e6388fe9501eca216cb1596940bf41083e2', '0x6111956b2ae88f8', 4)).toEqual(
            '0x6f003d687db73af9b0675080e87208027881dccf5a6fd35eed4f88568ed7f37',
        );
        expect(contract.precomputeTokenId('0x3ef5b02bcc5d30f3f0d35d55f365e6388fe9501e216cb1596940bf41083e2', '0x6111956b2a0842138b26e88f8', 5)).toEqual(
            '0x3f7dc95b8ce50f4c0e75d7c2c6cf04190e45c3cb4c26e52b9993df08ffb7e5a',
        );
        expect(contract.precomputeTokenId('0x3ef5b02b30f3f0d35d55f365e6388fe9501eca216cb1596940bf41083e2', '0x6111938b2df81a3e6e88f8', 6)).toEqual(
            '0x5289ebc74ed85b93bd3f2da93cb3b836b0b8bd6c3924b29d916f6882998dc06',
        );
        expect(contract.precomputeTokenId('0x3ef5b0388fe9501eca216cb1596940bf41083e2', '0x6111956b2a02138b2df81a3e6e88f8', 7)).toEqual(
            '0x7e49695c97a0b7779bfcc0f532866b5f8ed03999a7d3cd093d585dd5eb23c39',
        );
        expect(contract.precomputeTokenId('0x3ef5b02bcc5d30f3f0d35d5cb1596940bf41083e2', '0x611138b2df81a3e6e88f8', 8)).toEqual(
            '0x1fcea5dd923ed43f376c2ff1fc86fecf221b1fad82d6caf6221f5b71a787573',
        );
    });
});