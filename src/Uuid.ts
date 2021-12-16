import { v4 as uuidv4 } from 'uuid';

export { uuidv4 };

export function hexUuid(): string
{
    let buf = [] as Array<number>;
    uuidv4(undefined, buf);
    return "0x" + buf.map(x => x.toString(16).padStart(2, '0')).join("");
}