
export default function getBaseUrl()
{
    var baseUrl = "http://localhost:5000"
    if (import.meta.env.PROD)
        baseUrl = "https://api." + window.location.hostname
    return baseUrl
}

var baseUrl = getBaseUrl();
export async function fetchData(endpoint: string, body: object = {}): Promise<any>
{
    var headers = new Headers();
    headers.append("Content-Type", "application/json");
    var dat: RequestInit = {
        method: "POST",
        headers: headers,
        mode: "cors",
        body: JSON.stringify(body)
    };
    return fetch(`${baseUrl}/${endpoint}`, dat)
        .then(x => x.json())
}
