export function getSetAddress(addresses: Record<string, string>, collection: string | number | undefined) {
    if (!collection)
        return addresses.set_nft!;
    return {
        '0': addresses.set_nft,
        '1': addresses.set_nft_sp,
        '2': addresses.set_nft_briqmas,
        '3': addresses.set_nft_ducks,
        '4': addresses.set_nft_1155_fren_ducks,

        'generic': addresses.set_nft,
        'starknet_planet': addresses.set_nft_sp,
        'briqmas': addresses.set_nft_briqmas,
        'ducks_everywhere': addresses.set_nft_ducks,
        'fren_ducks': addresses.set_nft_1155_fren_ducks,
    }['' + collection] || addresses.set_nft!;
}

export function getBookletAddress(addresses: Record<string, string>, collection: string | number | undefined) {
    if (!collection)
        return addresses.booklet_ducks!;
    return {
        '1': addresses.booklet_starknet_planet,
        '2': addresses.booklet_briqmas,
        '3': addresses.booklet_ducks,
        '4': addresses.booklet_fren_ducks,

        'starknet_planet': addresses.booklet_starknet_planet,
        'briqmas': addresses.booklet_briqmas,
        'ducks_everywhere': addresses.booklet_ducks,
        'fren_ducks': addresses.booklet_fren_ducks,
    }['' + collection] || addresses.booklet_ducks!;
}

export function getBoxAddress(addresses: Record<string, string>, collection: string | number | undefined) {
    if (!collection)
        return addresses.box_nft_sp!;
    return {
        '1': addresses.box_nft_sp,
        '2': addresses.box_nft_briqmas,

        'starknet_planet': addresses.box_nft_sp,
        'briqmas': addresses.box_nft_briqmas,
    }['' + collection] || addresses.box_nft_sp!;
}
