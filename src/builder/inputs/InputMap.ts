import type { BuilderInputState } from './input_states/BuilderInputState';

/**
 * Map input states to specific FSM states.
 */
export const inputMap: { [key: string]: new () => BuilderInputState } = {};
