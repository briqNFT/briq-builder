import { v4 as uuidv4 } from 'uuid';

export { uuidv4 };

export function hexUuid(input?: Array<number>): string
{
    let buf = [] as Array<number>;
    if (input)
        buf = input;
    else
        uuidv4(undefined, buf);
    let res = buf.map(x => x.toString(16).padStart(2, '0')).join("");
    if (res[0] === "0")
        res = res.replace(/^0+/, '');
    return "0x" + res;
}
