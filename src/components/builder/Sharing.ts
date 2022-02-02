import type { SetData } from "../../builder/SetData";

export const SHARE_VERSION = 2;

export function getShareLink(network: string, setId: string, version: number = SHARE_VERSION) {
    return `${window.location.hostname}/share?set_id=${setId}&network=${network}&version=${version}`;
};

export function getRelativeShareLink(network: string, setId: string, version: number = SHARE_VERSION) {
    return `/share?set_id=${setId}&network=${network}&version=${version}`;
};
