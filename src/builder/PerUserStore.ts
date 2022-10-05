import { markRaw, reactive, Ref, toRaw, watchEffect } from 'vue';
import { maybeStore, walletInitComplete } from '@/chain/WalletLoading';
import type { UserID, WalletStore } from '@/chain/Wallet';
import { APP_ENV } from '@/Meta';

export interface perUserStorable {
    user_id: string;

    _init?(): void;
    onEnter?(oldAddress: string | undefined, newAddress: string): void
    onLeave?(oldAddress: string, newAddress: string | undefined): void

    _deserialize?(data: Record<string, any>): void;
    _serialize?(): Record<string, any>;
}

const PER_USER_STORE_VERSION = 1;

// Lazy hack
const stores = {};

export const perUserStore = <T extends perUserStorable>(classType: new () => T) => {
    if (classType.name in stores)
        throw new Error('Same class is used in perUserStore which will fail to serialize, change things');
    stores[classType.name] = true;

    return reactive(new class {
        _perWallet = {} as { [wallet: UserID]: T };
        currentWallet = undefined as undefined | string;

        get current() {
            if (!this.currentWallet)
                return undefined;
            return this._perWallet[this.currentWallet];
        }

        /* Exists solely for the purpose of being called somewhere, so that the import is used & things happen. */
        _setup = false;
        setup(_walletInitComplete: typeof walletInitComplete = walletInitComplete, _maybeStore: typeof maybeStore = maybeStore) {
            if (this._setup)
                return;
            this._setup = true;
            try {
                const serializedData = JSON.parse(window.localStorage.getItem(classType.name));
                if (serializedData.version !== PER_USER_STORE_VERSION)
                    window.localStorage.removeItem(classType.name);
                for (const wallet in serializedData.data) {
                    if (!this._perWallet[wallet]) {
                        this._perWallet[wallet] = new classType();
                        this._perWallet[wallet].user_id = wallet;
                        this._perWallet[wallet]?._init?.();
                    }
                    this._perWallet[wallet]._deserialize(serializedData.data[wallet])
                }
            } catch(err) {
                if (APP_ENV === 'dev')
                    console.error(err)
            }

            _walletInitComplete.then(() => {
                watchEffect(() => {
                    const old = this.currentWallet;
                    this.currentWallet = _maybeStore.value?.user_id || undefined;
                    if (this.currentWallet && !this._perWallet[this.currentWallet]) {
                        this._perWallet[this.currentWallet] = new classType();
                        this._perWallet[this.currentWallet].user_id = this.currentWallet;
                        this._perWallet[this.currentWallet]?._init?.();
                    }
                    if (old)
                        this._perWallet[old].onLeave?.(old, this.currentWallet);
                    if (this.currentWallet)
                        this.current!.onEnter?.(old, this.currentWallet);
                })
            })

            watchEffect(() => {
                const data = {};
                for (const wallet in this._perWallet)
                    if (classType.prototype._serialize)
                        data[wallet] = this._perWallet[wallet]._serialize();
                window.localStorage.setItem(classType.name, JSON.stringify({
                    version: PER_USER_STORE_VERSION,
                    data,
                }))
            })
        }
    })
};