import { DEV, APP_ENV } from './Meta'

function getCanonicalDomain() {
    if (window.location.hostname.indexOf("sltech") !== -1)
        return "sltech.company";
        "briq.construction";
}

export default function getBaseUrl()
{
    // Hack for dev when I want chain-connectivity.
    if (DEV && true)
        return "https://api.test.sltech.company";

    return {
        "dev": "http://localhost:5050",
        "test": "https://api.test.sltech.company",
        "prod": `https://api.${getCanonicalDomain()}`,
    }[APP_ENV];
}

var baseUrl = getBaseUrl();
export async function fetchData(endpoint: string, body?: object): Promise<any>
{
    var headers = new Headers();
    headers.append("Content-Type", "application/json");
    var dat: RequestInit = {
        method: body ? "POST" : "GET",
        headers: headers,
        mode: "cors"
    };
    if (body)
        dat.body = JSON.stringify(body);

    let req = await fetch(`${baseUrl}/${endpoint}`, dat)
    if (!req.ok)
        throw new Error("HTTP error: " + (await req.json())?.detail ?? 'unknown error');
    return req.json();
}

export function doDownload(url: string, filename: string)
{
     let link = document.createElement('a');
     link.href = url;
     link.download = filename;
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
}

export function downloadData(data: any, mime: string, filename: string)
{
        let blob = new Blob([data], { type: mime });
        let url = URL.createObjectURL(blob);
        doDownload(url, filename);
        URL.revokeObjectURL(url);
}

export function downloadJSON(json: JSON, filename: string)
{
        let data = JSON.stringify(json);
        let blob = new Blob([data], { type: 'application/json' });
        let url = URL.createObjectURL(blob);
        doDownload(url, filename);
        URL.revokeObjectURL(url);
}
