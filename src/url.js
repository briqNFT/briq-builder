
export default function getBaseUrl()
{
    var base_url = "http://localhost:5000"
    console.log("PROD?", import.meta.env.PROD)
    if (import.meta.env.PROD)
        base_url = "https://sltech.company"
    return base_url
}