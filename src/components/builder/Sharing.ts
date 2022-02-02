import type { SetData } from "../../builder/SetData";

export const SHARE_VERSION = 2;

export function getShareLink(network: string, setData: SetData, version: number = SHARE_VERSION) {
    return `${window.location.hostname}/share?set_id=${setData.id}&network=${network}&version=${version}`;
};

export function getRelativeShareLink(network: string, setData: SetData, version: number = SHARE_VERSION) {
    return `/share?set_id=${setData.id}&network=${network}&version=${version}`;
};
