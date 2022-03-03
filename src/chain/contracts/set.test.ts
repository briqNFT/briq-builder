import SetContract from "./set";
import { Signer } from 'starknet';

jest.mock("starknet");

describe('Test Export', () => {
    it('should compute token ID correctly', () => {
        let contract = new SetContract("0xcafe", new Signer());
        
        expect(contract.precomputeTokenId("0xcafe", "0x12345")).toEqual("0xe02664d2ab0abed66282e0541f19cffdf2025e3a2ef4ddc000000000000000");
        expect(contract.precomputeTokenId("0xfade", "0x54321")).toEqual("0xca75144c4b4508031da7b0dc55bcffa6566faf2e2024c85800000000000000");
        expect(contract.precomputeTokenId("0xbebe", "0x22222")).toEqual("0x35c677db16257dbcf928f3ff055845149075c11087633d67800000000000000");
    })
})