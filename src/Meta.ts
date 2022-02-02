export const PROD = import.meta.env.PROD;
export const DEV = import.meta.env.DEV;

export const VERSION = import.meta.env.VERSION;

export default function getBaseUrl()
{
    var baseUrl = "http://localhost:5050"
    if (PROD)
        baseUrl = "https://api." + window.location.hostname.replace("www.", "");
    return baseUrl
}

export const APP_ENV = (() => {
    if (window.location.hostname.indexOf("test.sltech.company") !== -1)
        return "test";
    if (window.location.hostname.indexOf("sltech.company") !== -1 || window.location.hostname.indexOf("briq.construction") !== -1)
        return "prod";
    return "dev";
})();

