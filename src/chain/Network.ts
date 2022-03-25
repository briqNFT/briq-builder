import { reactive } from 'vue';
import { APP_ENV } from '@/Meta';

/**
 * Sort of an abstraction around the idea of a chain + network.
 */

export type CHAIN_NETWORKS = "localhost" | "starknet-testnet" | "starknet-testnet-legacy" | "starknet-mainnet";

var network = reactive({
    network: "starknet-testnet" as CHAIN_NETWORKS,
})

export function getCurrentNetwork() { return network.network; };
export function setNetwork(networkName: CHAIN_NETWORKS)
{
    network.network = networkName;
}

export async function chooseDefaultNetwork()
{
    if (APP_ENV === "dev")
    {
        try
        {
            await fetch('http://localhost:5000/is_alive');
            network.network = "localhost";
            console.log("Switching to local provider");
        }
        catch(_) {};
    }    
}
