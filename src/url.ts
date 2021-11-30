
export default function getBaseUrl()
{
    var baseUrl = "http://localhost:5000"
    if (import.meta.env.PROD)
        baseUrl = "https://api." + window.location.hostname
    return baseUrl
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
    return fetch(`${baseUrl}/${endpoint}`, dat)
        .then(x => x.json())
}

function doDownload(url: string, filename: string)
{
     let link = document.createElement('a');
     link.href = url;
     link.download = filename;
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
}

export function downloadJSON(json: JSON, filename: string)
{
        let data = JSON.stringify(json);
        let blob = new Blob([data], { type: 'application/json' });
        let url = URL.createObjectURL(blob);
        doDownload(url, filename);
        URL.revokeObjectURL(url);
}
