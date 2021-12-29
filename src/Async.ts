/**
 * Run a promise only once, concurrent calls will wait on the same promise.
 * Useful to avoid multiple network connections.
 */
export function noParallel(func: CallableFunction)
{
    var prom: Promise<any> | undefined;
    return async function(...args: any[]) {
        if (prom)
            return await prom;
        prom = func(...args);
        let res = await prom;
        prom = undefined;
        return res;
    }
}

export class OutdatedPromiseError extends Error
{

};

/**
 * If the promise runs several time, only the latest succeeds.
 */
export function ticketing<T>(func: (...args: any[]) => Promise<T>): (...args: any[]) => Promise<T>
{
    var ticket = 0;
    return async function(...args: any[]): ReturnType<typeof func> {
        let myTicket = ++ticket;
        let res = await func.call(this, ...args);
        if (ticket > myTicket)
            throw new OutdatedPromiseError("Outdated promise");
        return res;
    }
}

/**
 * Run a function, ignoring outdated promises error from ticketing.
 * The execution of func will still be stopped at whatever raised the error.
 */
export async function ignoreOutdated<T>(func: (...args: any[]) => Promise<T>): Promise<T>
{
    let ret: T;
    try {
        ret = await func();
    } catch(err) {
        if (!(err instanceof OutdatedPromiseError))
            throw err;
    }
    return ret!;
}