import { readableNumber, readableUnit, fromETH } from './BigNumberForHumans';

describe('Test human readable representations of wei values', () => {
    it('should convert 1.23 ETH correctly', () => {
        expect(readableNumber('1230000000000000000')).toEqual('1.23');
    });
    it('should show 123 GWEI correctly correctly', () => {
        expect(readableNumber('123000000000')).toEqual('123');
    });
    it('should show wei values correctly', () => {
        expect(readableNumber('123')).toEqual('123');
    });

    it('should get the units right', () => {
        expect(readableUnit('1230000000000000000')).toEqual('ETH');
        expect(readableUnit('123000000000')).toEqual('GWEI');
        expect(readableUnit('123')).toEqual('WEI');
        expect(readableUnit('0')).toEqual('ETH');
    });

    it('should handle threshold values right', () => {
        expect(readableNumber('100000000000000')).toEqual('0.0001');
        expect(readableNumber('1000000000')).toEqual('1');
    });

    it('should round up with good significant digits', () => {
        const growBid = (bid: any) => {
            const mb = BigInt(bid);
            const gr = mb * BigInt(50) / BigInt(1000);
            return mb + gr;
        };
        expect(+growBid(5512500000).toString()).toEqual(5788125000);
        // We try to maintain significant digits.
        expect(readableNumber(growBid('55125000000000000000'))).toEqual('57.89');
        expect(readableNumber(growBid('55125000000000000'))).toEqual('0.05789');
        expect(readableNumber(growBid('5512500000000000'))).toEqual('0.005789');
        expect(readableNumber(growBid('551250000000000'))).toEqual('0.0005789');
    })

    it('should show numbers too big for javascript', () => {
        expect(readableNumber('123000000000000000000000000000000000')).toEqual('123000000000000000');
    });

    it('should show decimals when it makes sense', () => {
        expect(readableNumber('1000000000000000000')).toEqual('1');
        expect(readableNumber('1100000000000000000')).toEqual('1.1');
        expect(readableNumber('1010000000000000000')).toEqual('1.01');
        // This gets rounded up.
        expect(readableNumber('10000010000000000000000')).toEqual('10001');
    });
});

describe('Parse human numbers into WEI values', () => {
    it('Should parse a variety of forms correctly', () => {
        expect(fromETH('1').toString()).toEqual('1000000000000000000');
        expect(fromETH('1').toString()).toEqual('1000000000000000000');
        expect(fromETH('001').toString()).toEqual('1000000000000000000');
        expect(fromETH('001').toString()).toEqual('1000000000000000000');
        expect(fromETH('1.23').toString()).toEqual('1230000000000000000');
        expect(fromETH('1,23').toString()).toEqual('1230000000000000000');
        expect(fromETH('1.03').toString()).toEqual('1030000000000000000');
        expect(fromETH('1,03').toString()).toEqual('1030000000000000000');
        expect(fromETH('1.0300').toString()).toEqual('1030000000000000000');
        expect(fromETH('1,0300').toString()).toEqual('1030000000000000000');
        expect(fromETH('001.0300').toString()).toEqual('1030000000000000000');
        expect(fromETH('001,0300').toString()).toEqual('1030000000000000000');
        expect(fromETH('.03').toString()).toEqual('30000000000000000');

        // Allow spaces, people might want to do that.
        expect(fromETH('100 030').toString()).toEqual('100030000000000000000000');
        expect(fromETH('100 030,123').toString()).toEqual('100030123000000000000000');

        // Kinda weird but this isn't too bad
        expect(fromETH('.').toString()).toEqual('0');

        // Bit of an edge case but I'm going to go with 'why not'.
        expect(fromETH('0xcafe').toString()).toEqual('51966000000000000000000');
        // Super wtf but if you're doing this it's on purpose.
        expect(fromETH('0xcafe,0xfade').toString()).toEqual('51984076885954311749632');
    });

    it('Should bail on weird numbers and not numbers', () => {
        // TODO: I used to return NaN here but bigint doesn't support that. I just return 0.
        expect(fromETH('10,000,000.12')).toEqual(0n);
        expect(fromETH('10,000.000,12')).toEqual(0n);
        expect(fromETH('abc')).toEqual(0n);
    });
});