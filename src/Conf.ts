import * as Realms from './conf/realms';
import * as Default from './conf/default';

import MATERIALS_DATA from '@/MaterialsData';

import { APP_ENV } from '@/Meta';

export const CONF = window.location.hostname.indexOf("realms") !== -1 ? Realms.CONF : Default.CONF;

export function getNameFromMaterial(material: string)
{
    return MATERIALS_DATA?.[material].name || "Unknown";
}
