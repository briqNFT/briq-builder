import SetContract from './set';
import { Signer } from 'starknet';

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
        })).toEqual(['0x236661616661610000000000000000000000000000000024', '0x800000000000000180000000000000028000000000000003'])

        expect(contract._compress_shape_item({ data: { material: '0x242424', color: '#faafaa' }, pos: [1, -20000, 3],
        })).toEqual(['0x236661616661610000000000000000000000000000242424', '0x80000000000000017fffffffffffb1e08000000000000003'])

        expect(contract._compress_shape_item({ data: { material: '0x24', color: '#faafaa' }, pos: [1, 2, -3],
        })).toEqual(['0x236661616661610000000000000000000000000000000024', '0x800000000000000180000000000000027ffffffffffffffd'])

        expect(contract._compress_shape_item({ data: { material: '0x24', color: '#afafaf' }, pos: [-1, 2, 3],
        })).toEqual(['0x236166616661660000000000000000000000000000000024', '0x7fffffffffffffff80000000000000028000000000000003'])

        expect(contract._compress_shape_item({ data: { material: '0x24994', color: '#347873' }, pos: [1, 2, 3000000],
        })).toEqual(['0x233334373837330000000000000000000000000000024994', '0x8000000000000001800000000000000280000000002dc6c0'])
    });
});
