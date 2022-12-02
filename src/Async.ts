/**
 * Run a promise only once, concurrent calls will wait on the same promise.
 * Useful to avoid multiple network connections.
 */
export function noParallel<T>(func: (...args: any[]) => Promise<T>): typeof func {
    let prom: Promise<any> | undefined;
    return async function (...args: any[]) {
        if (prom)
            return await prom;
        prom = func.call(this, ...args);
        const res = await prom;
        prom = undefined;
        return res;
    };
}

export class OutdatedPromiseError extends Error {}

/**
 * If the promise runs several time, only the latest succeeds.
 */
export function ticketing<T>(func: (..._args: any[]) => Promise<T>): (..._args: any[]) => Promise<T> {
    let ticket = 0;
    return async function (...args: any[]): ReturnType<typeof func> {
        const myTicket = ++ticket;
        const res = await func.call(this, ...args);
        if (ticket > myTicket)
            throw new OutdatedPromiseError('Outdated promise');
        return res;
    };
}

/**
 * Run a function, ignoring outdated promises error from ticketing.
 * The execution of func will still be stopped at whatever raised the error.
 */
export async function ignoreOutdated<T>(func: (..._args: any[]) => Promise<T>): Promise<T> {
    let ret: T;
    try {
        ret = await func();
    } catch (err) {
        if (!(err instanceof OutdatedPromiseError))
            throw err;
    }
    return ret!;
}

export function isOutdated(error: any) {
    return error instanceof OutdatedPromiseError;
}

/**
 * Similar to watchEffect, but awaitable. Given watchEffect runs immediately (but executes on next tick I think), this shouldn't be too slow.
 * Convenient in case you want to await on an async side-effect.
 */
import { watchEffect } from 'vue';
export async function watchEffectAndWait(func: () => Promise<any>, ...args: any[]) {
    await new Promise((resolve) => {
        // To do minimal computation, just have a fire-and-forget function that resets itself.
        let f: () => Promise<any>;
        f = async () => {
            await func();
            resolve(true); // true is just to make typescript happy.
            f = func;
        };
        watchEffect(async () => {
            await f();
        }, ...args);
    });
}
