import { APP_ENV } from "./Meta";

export const featureFlags = {
    briq_select_movement: APP_ENV !== 'prod'
}
