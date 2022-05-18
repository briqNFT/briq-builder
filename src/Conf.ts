import * as Realms from './conf/realms';
import * as Default from './conf/default';

import MaterialsData from '@/MaterialsData';

export const CONF = window.location.hostname.indexOf('realms') !== -1 ? Realms.CONF : Default.CONF;

export function getNameFromMaterial(material: string) {
    return MaterialsData?.[material].name || 'Unknown';
}

export function getIconFromMaterial(material: string) {
    return MaterialsData?.[material].icon || MaterialsData?.['0x1'].icon;
}

export function addMaterialCSS(material: string, color: string, object ?: object) {
    return Object.assign((MaterialsData[material]?.css?.(color) ?? MaterialsData['0x1'].css(color)), object);
}
