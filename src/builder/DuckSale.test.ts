import { isAllowListedForDucks } from './DucksSale';

const isPart = '0x0006AD14eb0207a134fe51ae53e27a8b37ee7a9796b972f34ad0da91c728c7d138';
const isNotPart = '0xCaFe';

const allowlist = 'ducks_everywhere/3';
const notAllowlist = 'ducks_everywhere/4';

describe('Test DuckSale', () => {
    test('should account for allowlisting correctly', async () => {
        expect(isAllowListedForDucks(isPart)).toEqual(true);
        expect(isAllowListedForDucks(isNotPart)).toEqual(false);
    });

    test('should account for allowlisting correctly for allowlisted ducks', async () => {
        expect(isAllowListedForDucks(isPart, allowlist)).toEqual(true);
        expect(isAllowListedForDucks(isNotPart, allowlist)).toEqual(false);
    });

    test('should account for allowlisting correctly for non allowlisted ducks', async () => {
        expect(isAllowListedForDucks(isPart, notAllowlist)).toEqual(true);
        expect(isAllowListedForDucks(isNotPart, notAllowlist)).toEqual(true);
    });
});
