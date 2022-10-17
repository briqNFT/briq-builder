import { DEV, APP_ENV } from './Meta';

function getCanonicalDomain() {
    if (window.location.hostname.indexOf('sltech') !== -1)
        return 'sltech.company';
    return 'briq.construction';
}

export default function getBaseUrl() {
    // Hack for dev when I want chain-connectivity.
    if (DEV && false)
        return 'https://api.test.sltech.company';

    return {
        dev: 'http://localhost:5055',
        test: 'https://test.sltech.company/api_relay',
        prod: `https://api.${getCanonicalDomain()}`,
    }[APP_ENV];
}

export function doDownload(url: string, filename: string) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function downloadData(data: any, mime: string, filename: string) {
    const blob = new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob);
    doDownload(url, filename);
    URL.revokeObjectURL(url);
}

export function downloadJSON(json: JSON, filename: string) {
    const data = JSON.stringify(json);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    doDownload(url, filename);
    URL.revokeObjectURL(url);
}
