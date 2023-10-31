import { getBaseUrl, getAdminBaseUrl } from './url';
import { getCurrentNetwork } from './chain/Network';

class BackendManager {
    url: string;

    last_requests = {} as { [url: string]: {
        timestamp: number,
        request: Promise<any>,
    }};

    constructor(url: string) {
        this.url = url;
    }

    getMetadata(set_id: string, chain_id: string = getCurrentNetwork()) {
        return this.fetch(`v1/metadata/${chain_id}/${set_id}`);
    }

    getMetadataRoute(set_id: string, chain_id: string = getCurrentNetwork()) {
        return `v1/metadata/${chain_id}/${set_id}`;
    }
    getMetadataUrl(set_id: string, chain_id: string = getCurrentNetwork()) {
        return `${this.url}/v1/metadata/${chain_id}/${set_id}`;
    }

    getPreview(set_id: string, chain_id: string = getCurrentNetwork()) {
        return this.fetch(`v1/preview/${chain_id}/${set_id}`);
    }

    getPreviewUrl(set_id: string, chain_id: string = getCurrentNetwork()) {
        return `${this.url}/v1/preview/${chain_id}/${set_id}.png`;
    }

    storeSet(data: { owner: string, token_id: string, chain_id: string, data: any, image_base64: any, message_hash?: string, signature?: any}) {
        return backendManager.post('v1/store_set', data);
    }

    getRoute(endpoint: string) {
        return  `${this.url}/v1/${endpoint}`;
    }

    async fetch(endpoint: string, cacheTime = 1000): Promise<any> {
        const url = `${this.url}/${endpoint}`;
        // Automatically grab the latest query if it's been sent recently enough.
        if (this.last_requests[url] && Date.now() - this.last_requests[url].timestamp < cacheTime)
            return await this.last_requests[url].request;

        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        const dat: RequestInit = {
            method: 'GET',
            headers: headers,
            mode: 'cors',
            credentials: 'same-origin',
        };

        this.last_requests[url] = {
            timestamp: Date.now(),
            request: (async () => {
                const req = await fetch(url, dat);
                if (!req.ok)
                    throw new Error('HTTP error: ' + (await req.json())?.detail ?? 'unknown error');
                return req.json();
            })(),
        }
        return await this.last_requests[url].request;
    }

    async post(endpoint: string, body?: object): Promise<any> {
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        const dat: RequestInit = {
            method: 'POST',
            headers: headers,
            mode: 'cors',
            credentials: 'same-origin',
        };
        if (body)
            dat.body = JSON.stringify(body);

        const req = await fetch(encodeURI(`${this.url}/${endpoint}`), dat);
        if (!req.ok)
            throw new Error('HTTP error: ' + (await req.json())?.detail ?? 'unknown error');
        return req.json();
    }
}

export const backendManager = new BackendManager(getBaseUrl());
export const adminBackendManager = new BackendManager(getAdminBaseUrl());
