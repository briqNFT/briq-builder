import { hexUuid } from "./Uuid";

describe('Test hexUuid', () => {
    it('should create proper hex stuff', () => {
        expect(hexUuid()).toMatch(/^0x[a-f0-9]+$/);
        expect(hexUuid([0x02, 0x14])).toEqual("0x214");
        expect(hexUuid([0x00, 0x00, 0x00, 0x14])).toEqual("0x14");
        expect(hexUuid([0x00, 0x00, 0x00, 0x14, 0x00])).toEqual("0x1400");
    })
})