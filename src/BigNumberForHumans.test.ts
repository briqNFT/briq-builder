import { readableNumber, readableUnit, fromETH } from './BigNumberForHumans';
import * as starknet from 'starknet';

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
    });

    it('should handle threshold values right', () => {
        expect(readableNumber('100000000000000')).toEqual('0.0001');
        expect(readableNumber('1000000000')).toEqual('1');
    });

    it('should round up', () => {
        const growBid = (bid: any) => {
            const mb = starknet.number.toBN(bid);
            const gr = mb.mul(starknet.number.toBN(50)).idivn(starknet.number.toBN(1000));
            return mb.add(gr);
        };
        expect(+growBid(5512500000).toString()).toEqual(5788125000);
        expect(readableNumber(growBid('55125000000000000'))).toEqual('0.057882');
    })

    it('should show numbers too big for javascript', () => {
        expect(readableNumber('123000000000000000000000000000000000')).toEqual('123000000000000000');
    });

    it('should show decimals when it makes sense', () => {
        expect(readableNumber('1000000000000000000')).toEqual('1');
        expect(readableNumber('1100000000000000000')).toEqual('1.1');
        expect(readableNumber('1010000000000000000')).toEqual('1.01');
        expect(readableNumber('10000010000000000000000')).toEqual('10000.01');
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
        expect(fromETH('10,000,000.12')).toEqual(NaN);
        expect(fromETH('10,000.000,12')).toEqual(NaN);
        expect(fromETH('abc')).toEqual(NaN);
    });
});