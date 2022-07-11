import { reactive, watchEffect } from 'vue';
import { maybeStore, walletInitComplete } from '@/chain/WalletLoading';
import type { UserID } from '@/chain/Wallet';

export interface perUserStorable {
    onEnter?(oldAddress: string | undefined, newAddress: string): void
    onLeave?(oldAddress: string, newAddress: string | undefined): void
}

export const perUserStore = <T extends perUserStorable>(classType: new () => T) => reactive(new class {
    _perWallet = {} as { [wallet: UserID]: T };
    currentWallet = undefined as undefined | string;

    get current() {
        if (!this.currentWallet)
            return undefined;
        return this._perWallet[this.currentWallet];
    }
    /* Exists solely for the purpose of being called somewhere, so that the import is used & things happen. */
    _setup = false;
    setup() {
        if (this._setup)
            return;
        walletInitComplete.then(() => {
            watchEffect(() => {
                const old = this.currentWallet;
                this.currentWallet = maybeStore.value?.user_id || undefined;
                if (this.currentWallet && !this._perWallet[this.currentWallet])
                    this._perWallet[this.currentWallet] = new classType();
                if (old)
                    this._perWallet[old].onLeave?.(old, this.currentWallet);
                if (this.currentWallet)
                    this.current!.onEnter?.(old, this.currentWallet);
            })
        })
        this._setup = true;
    }
});