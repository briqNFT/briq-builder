import { reactive, watch, watchEffect } from 'vue';
import { maybeStore, walletInitComplete } from '@/chain/WalletLoading';
import type { UserID } from '@/chain/Wallet';
import { APP_ENV } from '@/Meta';
import { logDebug } from '@/Messages';

export interface perUserStorable {
    user_id: string;

    _init?(): void;
    onEnter?(oldAddress: string | undefined, newAddress: string): void
    onLeave?(oldAddress: string, newAddress: string | undefined): void

    _deserialize?(data: Record<string, any>): void;
    _serialize?(): Record<string, any>;
    _onStorageChange?(data: Record<string, any>): void;
}

const PER_USER_STORE_VERSION = 1;

// Lazy hack
const stores = {};

export const perUserStore = <T extends perUserStorable>(storeName: string, classType: new () => T) => {
    if (storeName in stores)
        throw new Error('Same class is used in perUserStore which will fail to serialize, change things');
    stores[storeName] = true;

    return reactive(new class {
        _perWallet = {} as { [wallet: UserID]: T };
        currentWallet = undefined as undefined | string;

        get current() {
            if (!this.currentWallet)
                return undefined;
            return this._perWallet[this.currentWallet];
        }

        get state() {
            return this._setup;
        }

        _setup = 'NOT_SETUP' as 'NOT_SETUP' | 'SETUP' | 'WALLET_LOADED';
        /* Exists solely for the purpose of being called somewhere, so that the import is used & things happen. */
        setup(_walletInitComplete: typeof walletInitComplete = walletInitComplete, _maybeStore: typeof maybeStore = maybeStore) {
            if (this._setup !== 'NOT_SETUP')
                return;
            try {
                const storedData = window.localStorage.getItem(storeName);
                if (storedData) {
                    const serializedData = JSON.parse(storedData);
                    if (serializedData.version !== PER_USER_STORE_VERSION)
                        window.localStorage.removeItem(storeName);
                    for (const wallet in serializedData.data) {
                        if (!this._perWallet[wallet]) {
                            this._perWallet[wallet] = new classType();
                            this._perWallet[wallet].user_id = wallet;
                            this._perWallet[wallet]?._init?.();
                            logDebug(storeName, 'INIT COMPLETE');
                        }
                        this._perWallet[wallet]._deserialize(serializedData.data[wallet])
                    }
                }
            } catch(err) {
                if (APP_ENV === 'dev')
                    console.error(err)
            }
            // At this point (sync function so safe), we are setup.
            this._setup = 'SETUP';

            window.addEventListener('storage', (event: StorageEvent) => {
                if (event.key !== storeName)
                    return;
                for (const wallet in this._perWallet)
                    try {
                        this._perWallet[wallet]._onStorageChange?.(JSON.parse(event.newValue!).data[wallet]);
                    } catch(err) {
                        if (APP_ENV === 'dev')
                            console.error(err)
                    }
            });

            _walletInitComplete.then(() => {
                watch([_maybeStore.value], () => {
                    const old = this.currentWallet;
                    this.currentWallet = _maybeStore.value?.user_id || undefined;
                    if (old === this.currentWallet)
                        return;
                    if (this.currentWallet && !this._perWallet[this.currentWallet]) {
                        this._perWallet[this.currentWallet] = new classType();
                        this._perWallet[this.currentWallet].user_id = this.currentWallet;
                        this._perWallet[this.currentWallet]?._init?.();
                        logDebug(storeName, 'INIT COMPLETE');
                    }
                    if (old)
                        this._perWallet[old].onLeave?.(old, this.currentWallet);
                    if (this.currentWallet)
                        this.current!.onEnter?.(old, this.currentWallet);
                }, {
                    deep: true,
                    immediate: true,
                });
                this._setup = 'WALLET_LOADED';
            })

            watchEffect(() => {
                const data = {};
                for (const wallet in this._perWallet)
                    if (classType.prototype._serialize)
                        data[wallet] = this._perWallet[wallet]._serialize();
                window.localStorage.setItem(storeName, JSON.stringify({
                    version: PER_USER_STORE_VERSION,
                    data,
                }))
            })
        }
    })
};