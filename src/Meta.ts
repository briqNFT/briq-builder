export const PROD = import.meta.env.PROD;
export const DEV = import.meta.env.DEV;
export const TEST_ENV = !!import.meta.env.TEST;

export const VERSION = import.meta.env.VERSION;

export const APP_ENV = (() => {
    if (import.meta.env.MODE === 'production')
        return 'prod';
    if (import.meta.env.MODE === 'staging')
        return 'test';
    return 'dev';
})();
