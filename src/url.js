
export default function getBaseUrl()
{
    var base_url = "http://localhost:5000"
    if (import.meta.env.PROD)
        base_url = "https://api." + window.location.hostname
    return base_url
}