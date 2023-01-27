import { shallowReactive } from 'vue';

// Returns existing object or creates a new one and returns it.
export const defaultDict = <T, U extends string>(t: (prop: U) => T, ...args: any[]) => {
    // Shallow reactive or proxies in vue start doing weird stuff
    return new Proxy(shallowReactive({} as Record<U, T>), {
        get: (target, prop: string, receiver): T => {
            if (Reflect.has(target, prop))
                return Reflect.get(target, prop, receiver);
            target[prop] = t(prop, ...args);
            return target[prop];
        },
        set: (target, prop, value) => {
            return Reflect.set(target, prop, value);
        },
    });
}
