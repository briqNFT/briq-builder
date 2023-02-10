// Some data about the ducks sale

import { number as nb } from 'starknet';

// These must be stored as non-0x lowercased prefixed hex strings
const allowList: string[] = [
    '3ef5b02bcc5d30f3f0d35d55f365e6388fe9501eca216cb1596940bf41083e2',
    '439d7ed01976d4633667dce210aa880aeadc85e6d3d621eb7b87659df54984',
    '59df66af2e0e350842b11ea6b5a903b94640c4ff0418b04ccedcc320f531a08',
];

export function isAllowListedForDucks(address: string | undefined) {
    console.log('toto', address, nb.toBN(address).toString(16))
    return address && allowList.includes(nb.toBN(address).toString(16));
}

export const allowlistedDucks = [
    'ducks_everywhere/3',
    'ducks_everywhere/9',
    'ducks_everywhere/10',
    'ducks_everywhere/12',
    'ducks_everywhere/15',
    'ducks_everywhere/20',
    'ducks_everywhere/22',
    'ducks_everywhere/25',
    'ducks_everywhere/26',
    'ducks_everywhere/32',
    'ducks_everywhere/35',
    'ducks_everywhere/44',
    'ducks_everywhere/49',
    'ducks_everywhere/52',
    'ducks_everywhere/57',
    'ducks_everywhere/61',
    'ducks_everywhere/64',
    'ducks_everywhere/65',
    'ducks_everywhere/73',
    'ducks_everywhere/77',
    'ducks_everywhere/80',
    'ducks_everywhere/83',
    'ducks_everywhere/85',
    'ducks_everywhere/87',
    'ducks_everywhere/93',
    'ducks_everywhere/96',
    'ducks_everywhere/101',
    'ducks_everywhere/104',
    'ducks_everywhere/107',
    'ducks_everywhere/110',
    'ducks_everywhere/112',
    'ducks_everywhere/113',
    'ducks_everywhere/116',
    'ducks_everywhere/125',
    'ducks_everywhere/126',
    'ducks_everywhere/130',
    'ducks_everywhere/138',
    'ducks_everywhere/142',
    'ducks_everywhere/149',
    'ducks_everywhere/152',
    'ducks_everywhere/156',
    'ducks_everywhere/159',
    'ducks_everywhere/160',
    'ducks_everywhere/171',
    'ducks_everywhere/174',
    'ducks_everywhere/184',
    'ducks_everywhere/195',
    'ducks_everywhere/197',
    'ducks_everywhere/198',
    'ducks_everywhere/200',
]
