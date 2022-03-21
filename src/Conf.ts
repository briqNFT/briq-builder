export * from './conf/realms';

export function getNameFromMaterial(material: string)
{
    return {
        "0x1": "Standard",
        "0x2": "Realms",
    }[material] || "Unknown";
}
