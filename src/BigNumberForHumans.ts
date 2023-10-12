import * as starknet from 'starknet';

const ONE_ETH = BigInt('1000000000000000000');
const GWEI_THRESHOLD = BigInt('10000000000000'); // 100K GWEI
const WEI_THRESHOLD = BigInt('1000000000'); // 1 GWEI

// TODO: support limited precision, which is a much harder problem in general.
export function readableNumber(number: starknet.num.BigNumberish) {
    const nb = BigInt(number);
    if (GWEI_THRESHOLD <= nb)
        // Big enough to be shown in ETH.
        // Since the lib doesn't allow decimals, I'll just divide and print.
        try {
            // Some fanciness for rounding up.
            const fullDecimals = (nb / BigInt('100000000000000')).toString();

            const divisor = Math.max(1, Math.pow(10, 8 - fullDecimals.length));
            const divisor_bn = ONE_ETH / BigInt(divisor);

            const div = nb / divisor_bn;
            const mod = nb % divisor_bn;

            // Make sure we do _not_ round down even post-division.
            if (mod > BigInt(0))
                return (Number(div + BigInt(1))/divisor).toString();
            return (Number(div)/divisor).toString();
        } catch(_) {
            // Number can't be represented in JS -> just print and cut the end.
            return nb.toString().slice(0, -18);
        }
    if (WEI_THRESHOLD <= nb)
        return (nb / WEI_THRESHOLD).toString()
    return nb.toString();
}

export function readableUnit(number: starknet.num.BigNumberish) {
    const nb = BigInt(number);
    if (nb == BigInt(0) || GWEI_THRESHOLD <= nb)
        return 'ETH';
    if (WEI_THRESHOLD <= nb)
        return 'GWEI';
    return 'WEI';
}

// Reading decimals into the system isn't supported, so I have to parse it manually.
// Because this is an annoying problem and JS has no good tools to do this,
// I'll implement a basic level of support that should be mostly 'good enough'.
// Furthermore, there is no guarantee that the number will actually fit into a bigint.
export function fromETH(numberString: string, _unit = 'ETH' as const/* | 'GWEI' | 'WEI'*/): bigint {
    // Assume that the decimals will be either a dot or a comma.
    // If we run into oddities, bail out and return NaN.
    const dots = numberString.match(/\./g)?.length || 0;
    const commas = numberString.match(/,/g)?.length || 0;
    let nb: string[];
    if (dots === 1 && commas !== 1)
        nb = numberString.split('.');
    else if (commas === 1 && dots !== 1)
        nb = numberString.split(',');
    else if (commas === 0 && dots === 0)
        nb = [numberString];
    else
        return BigInt(0);
    // This is kinda dumb on purpose
    nb = nb.map(x => x.replace(/ /g, ''));
    try {
        let output = BigInt(nb[0]) * ONE_ETH;
        if (nb.length == 2)
            // For decimals, I have to pad the value with zeros to get the right value.
            output = output + BigInt(nb[1].padEnd(18, '0'))
        return output;
    } catch(_) {
        return BigInt(0);
    }
}
