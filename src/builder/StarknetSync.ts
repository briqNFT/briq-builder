import { store } from "../store/Store";

import { watchEffect } from 'vue';

export function setupSync()
{
    watchEffect(async () => {
        if (!store.state.builderData.briqContract || !store.state.wallet.userWalletAddress)
            return;
        await store.dispatch("builderData/try_fetching_user_data");
    })
}
