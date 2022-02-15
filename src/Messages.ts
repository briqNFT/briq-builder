import { reactive } from 'vue';
import { PROD } from './Meta';

export const messagesStore = reactive({
    tooltip: undefined as undefined | string,
    messages: [] as string[],
});

export function pushMessage(message: string)
{
    messagesStore.messages.push(message);
}

export function setTooltip(tip?: string)
{
    messagesStore.tooltip = tip;
}

var forceDebug = false;
export const setForceDebug = () => forceDebug = true;

// TODO: move this elsewhere probably

export function logDebugDelay(func: () => any[])
{
    if (!forceDebug && PROD)
        return;
    logDebug(...func())
}

export function logDebug(...args : any[])
{
    if (!forceDebug && PROD)
        return;
    console.log(...args);
}
