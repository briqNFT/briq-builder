import { getCurrentNetwork } from './Network';

const EXPLORER_URL_BY_NETWORK = {
    'starknet-testnet': 'testnet.starkscan.co',
    'starknet-testnet2': 'testnet-2.starkscan.co',
    'starknet-testnet-legacy': 'testnet.starkscan.co',
    'starknet-mainnet': 'starkscan.co',
};

export function ExplorerTxUrl(transaction_hash: string, network = getCurrentNetwork()) {
    return `https://${EXPLORER_URL_BY_NETWORK[network] ?? 'testnet.starkscan.co'}/tx/${transaction_hash}#overview`;
}

export function ExplorerContractUrl(contractAddress: string, network = getCurrentNetwork()) {
    return `https://${EXPLORER_URL_BY_NETWORK[network] ?? 'testnet.starkscan.co'}/contract/${contractAddress}#overview`;
}
