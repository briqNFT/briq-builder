import type * as THREETYPES from 'three';

import type { OrbitControls as OrbitControlsType } from 'three/examples/jsm/controls/OrbitControls.js';
import type { EffectComposer as EffectComposerType } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import type { RenderPass as RenderPassType } from 'three/examples/jsm/postprocessing/RenderPass.js';
import type { SSAARenderPass as SSAARenderPassType } from 'three/examples/jsm/postprocessing/SSAARenderPass.js';
import type { SAOPass as SAOPassType } from 'three/examples/jsm/postprocessing/SAOPass.js';
import type bgu from 'three/examples/jsm/utils/BufferGeometryUtils';

import { logDebug } from './Messages';

// This is a lie.
export var THREE: typeof THREETYPES;

export var OrbitControls: typeof OrbitControlsType;
export var EffectComposer: typeof EffectComposerType;
export var RenderPass: typeof RenderPassType;
export var SSAARenderPass: typeof SSAARenderPassType;
export var SAOPass: typeof SAOPassType;
export var BufferGeometryUtils: typeof bgu;

async function setup() {
    let wrapper = await import ('./three_wrapper');
    THREE = wrapper.THREE;
    OrbitControls = wrapper.OrbitControls;
    EffectComposer = wrapper.EffectComposer;
    RenderPass = wrapper.RenderPass;
    SSAARenderPass = wrapper.SSAARenderPass;
    SAOPass = wrapper.SAOPass;
    BufferGeometryUtils = wrapper.BufferGeometryUtils;
    logDebug("Successfully dynamically loaded three.js");
}
export  var THREE_SETUP = setup();