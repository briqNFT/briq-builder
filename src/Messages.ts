
// Not fancy enough to warrant being a proper Store module IMO
import { reactive } from 'vue';

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