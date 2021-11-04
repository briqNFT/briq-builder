import { reactive } from 'vue'

export var adminStore = reactive({
    secretCode: ''
})

export function isOk()
{
    return adminStore.secretCode == "toto";
}