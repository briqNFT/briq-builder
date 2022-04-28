import type { SetData } from '../../builder/SetData';

export const SHARE_VERSION = 2;

export function getShareLink(network: string, setId: string, version: number = SHARE_VERSION) {
    return `${window.location.protocol}//${window.location.hostname}${
        window.location.port ? ':' + window.location.port : ''
    }/share?set_id=${setId}&network=${network}&version=${version}`;
}

export function getRelativeShareLink(network: string, setId: string, version: number = SHARE_VERSION) {
    return `/share?set_id=${setId}&network=${network}&version=${version}`;
}
