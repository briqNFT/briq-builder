/**
 * The purpose of this file is to leverage vite's automatic chunk splitting.
 * The bulk of the libs (e.g. starknet.js) are not needed on the homepage,
 * and not loading them there makes that page super-fast, and it doesn't slow the builder significantly.
 * Three.js is also split in a similar manner.
 */

import BuilderVue from '@/components/builder/Builder.vue';
import AdminVue from '@/components/Admin.vue';
import DebugVue from '@/components/debug/Debug.vue';
import * as walletModule from '@/chain/Wallet';
import _contractStore from '@/chain/Contracts';
import UnboxingVue_ from '@/components/builder/genesis/UnboxingLight.vue';
import Briqmas_ from '@/components/builder/genesis/Briqmas.vue';
import BriqmasNextDay_ from '@/components/builder/genesis/BriqmasCompleted.vue';
import BriqmasForest_ from '@/components/builder/briqmas_forest/Forest.vue';
import NotificationVue_ from './components/Notification.vue';
import NotificationsMenu_ from '@/components/NotificationsMenu.vue';
import ProfilePageVue_ from '@/components/profile/ProfilePage.vue';
import ThemesListingVue_ from './components/builder/genesis/ThemesListing.vue';
import ThemeRouter_ from './components/builder/genesis/ThemeRouter.vue';
import BoxSalePageVue_ from './components/builder/genesis/BoxSalePage.vue';
import BoxPageVue_ from './components/builder/genesis/BoxPage.vue';
import SetPageVue_ from './components/builder/genesis/SetPage.vue';
import Collections_ from '@/components/collections/ManageCollection.vue';
import BuyBriqsVue from '@/components/BuyBriqs.vue';

import { userPurchaseStore } from '@/builder/UserPurchase';

export const UnboxingVue = UnboxingVue_;
export const Briqmas = Briqmas_;
export const BriqmasNextDay = BriqmasNextDay_;
export const BriqmasForest = BriqmasForest_;
export const contractStore = _contractStore;
export const Builder = BuilderVue;
export const Admin = AdminVue;
export const Debug = DebugVue;
export const Wallet = walletModule;
export const NotificationVue = NotificationVue_;
export const NotificationsMenu = NotificationsMenu_;
export const ProfilePageVue = ProfilePageVue_;
export const ThemesListingVue = ThemesListingVue_;
export const ThemeRouter = ThemeRouter_;
export const BoxSalePageVue = BoxSalePageVue_;
export const BoxPageVue = BoxPageVue_;
export const SetPageVue = SetPageVue_;
export const Collections = Collections_;
export const BuyBriqs = BuyBriqsVue;

userPurchaseStore.setup();
