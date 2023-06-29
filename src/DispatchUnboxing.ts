/**
 * This file asynchronously loads the unboxing modules,
 * which load ammo.js and are in general pretty expensive.
 */

import UnboxingVue_ from '@/components/builder/genesis/UnboxingLight.vue';
import Briqmas_ from '@/components/builder/genesis/Briqmas.vue';
import BriqmasNextDay_ from '@/components/builder/genesis/BriqmasCompleted.vue';

export const UnboxingVue = UnboxingVue_;
export const Briqmas = Briqmas_;
export const BriqmasNextDay = BriqmasNextDay_;
