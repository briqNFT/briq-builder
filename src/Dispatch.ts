/**
 * The purpose of this file is to leverage vite's automatic chunk splitting.
 * The bulk of the libs (e.g. starknet.js) are not needed on the homepage,
 * and not loading them there makes that page super-fast, and it doesn't slow the builder significantly.
 * Three.js is also split in a similar manner.
 */

import BuilderVue from './components/builder/Builder.vue';
import AdminVue from './components/Admin.vue';
import DebugVue from './components/debug/Debug.vue';
import ShareVue from './components/builder/share/Share.vue';
import * as walletModule from '@/chain/Wallet';
import _contractStore from './chain/Contracts';
import UnboxingVue_ from './components/builder/genesis/UnboxingLight.vue';
import Briqmas_ from './components/builder/genesis/Briqmas.vue';

export const UnboxingVue = UnboxingVue_;
export const Briqmas = Briqmas_;
export const contractStore = _contractStore;
export const Builder = BuilderVue;
export const Admin = AdminVue;
export const Debug = DebugVue;
export const Share = ShareVue;
export const Wallet = walletModule;
