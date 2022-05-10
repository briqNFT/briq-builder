import getBaseUrl from './url';
import { getCurrentNetwork } from './chain/Network';

class BackendManager {
    url: string;

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
        return `${this.url}/v1/preview/${chain_id}/${set_id}`;
    }

    storeSet(data: { owner: string, token_id: string, chain_id: string, data: any, message_hash: string, signature: any, image_base64: any }) {
        return backendManager.post('v1/store_set', data);
    }

    async fetch(endpoint: string): Promise<any> {
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        const dat: RequestInit = {
            method: 'GET',
            headers: headers,
            mode: 'cors',
        };

        const req = await fetch(`${this.url}/${endpoint}`, dat);
        if (!req.ok)
            throw new Error('HTTP error: ' + (await req.json())?.detail ?? 'unknown error');
        return req.json();
    }

    async post(endpoint: string, body?: object): Promise<any> {
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        const dat: RequestInit = {
            method: 'POST',
            headers: headers,
            mode: 'cors',
        };
        if (body)
            dat.body = JSON.stringify(body);

        const req = await fetch(`${this.url}/${endpoint}`, dat);
        if (!req.ok)
            throw new Error('HTTP error: ' + (await req.json())?.detail ?? 'unknown error');
        return req.json();
    }
}

export const backendManager = new BackendManager(getBaseUrl());
