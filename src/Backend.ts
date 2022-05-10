import getBaseUrl from './url';

class BackendManager {
    url: string;

    constructor(url: string) {
        this.url = url;
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
