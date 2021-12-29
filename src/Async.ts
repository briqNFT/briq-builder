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

/**
 * If the promise runs several time, only the latest succeeds.
 */
 export function ticketing(func: CallableFunction)
 {
     var ticket = 1;
     return async function(...args: any[]) {
         let myTicket = ticket++;
         let res = await func(...args);
         if (ticket > myTicket)
            throw new Error("Outdated promise");
         return res;
     }
 }
