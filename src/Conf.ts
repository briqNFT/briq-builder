import * as Realms from './conf/realms';
import * as Default from './conf/default';

import { APP_ENV } from '@/Meta';

export const CONF = window.location.hostname.indexOf("realms") !== -1 ? Realms.CONF : Default.CONF;

export function getNameFromMaterial(material: string)
{
    return {
        "0x1": "Standard",
        "0x2": "Realms",
    }[material] || "Unknown";
}
