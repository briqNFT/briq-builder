
/**
 * I accidentally recreated swr / swrv because I didn't find them in my initial googling.
 * My API has ended up being slightly different, but also better suited to my micro-store setup.
 */

import { reactive } from 'vue';

// Fetchable is basically equivalent to useSWR, but my API offers _fetch, so it can be awaited in non-GUI code.
export class Fetchable<T> {
    _data = undefined as undefined | T;
    _fetch = undefined as undefined | Promise<T>;
    _error = undefined as any;

    get _status() {
        return this._data !== undefined ? 'LOADED' : (this._error !== undefined ? 'ERROR' : 'FETCHING');
    }

    async fetch(t: () => Promise<T>) {
        this._fetch = new Promise((res, rej) => {
            t().then((data) => {
                this._data = data;
                res(data);
            }).catch((err) => {
                this._error = err;
                rej();
            });
        });
    }

    clear() {
        this._data = undefined;
        this._fetch = undefined;
        this._error = undefined;
    }
}

export const makeAutoFetchable = <keyT, valueT>(dataFetcher: (key: keyT) => Promise<valueT>) => {
    return autoFetchable(reactive({}), dataFetcher);
}

// AutoFetchable is a proxy that automatically queries the object at 'key' when it is accessed,
// and returns the Fetchable.
export const autoFetchable = <T>(wraps: { [prop: string]: Fetchable<T> }, t: (prop: string) => Promise<T>) => {
    return new Proxy(wraps, {
        get: (target, prop: string, receiver): Fetchable<T> => {
            if (Reflect.has(target, prop))
                return Reflect.get(target, prop, receiver);
            target[prop] = new Fetchable<T>();
            target[prop].fetch(() => t(prop));
            return target[prop];
        },
        set: (target, prop, value) => {
            return Reflect.set(target, prop, value);
        },
    });
}
