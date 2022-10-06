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
