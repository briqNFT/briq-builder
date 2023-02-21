/**
 * Three.js is dynamically loaded as it's a rather hefty library and not needed on all pages.
 * This module exists to fake typescript into thinking it's statically loaded,
 * just query `await THREE_SETUP;` if you need to wait until three is loaded.
 */
import type * as three_wrapper from './three_wrapper';

import { logDebug } from './Messages';
import { setThreeLoadingComplete } from './threeLoading';
export { threeSetupComplete } from './threeLoading';

// This is a lie.
export let THREE: typeof three_wrapper.ALL_THREE;

export let SkeletonUtils: typeof three_wrapper.SkeletonUtils;
export let OrbitControls: typeof three_wrapper.OrbitControls;
export let FlyControls: typeof three_wrapper.FlyControls;
export let SelectionBox: typeof three_wrapper.SelectionBox;
export let BufferGeometryUtils: typeof three_wrapper.BufferGeometryUtils;

export let GLTFLoader: typeof three_wrapper.GLTFLoader;
export let EXRLoader: typeof three_wrapper.EXRLoader;

export let EffectComposer: typeof three_wrapper.EffectComposer;
export let RenderPass: typeof three_wrapper.RenderPass;
export let SAOPass: typeof three_wrapper.SAOPass;
export let SSAOPass: typeof three_wrapper.SSAOPass;
export let ShaderPass: typeof three_wrapper.ShaderPass;
export let SSAARenderPass: typeof three_wrapper.SSAARenderPass;
export let SMAAPass: typeof three_wrapper.SMAAPass;
export let TAARenderPass: typeof three_wrapper.TAARenderPass;

export let CopyShader: typeof three_wrapper.CopyShader;
export let GammaCorrectionShader: typeof three_wrapper.GammaCorrectionShader;
export let FXAAShader: typeof three_wrapper.FXAAShader;

async function setup() {
    const wrapper = await import('./three_wrapper');
    THREE = wrapper.ALL_THREE;

    SkeletonUtils = wrapper.SkeletonUtils;
    OrbitControls = wrapper.OrbitControls;
    FlyControls = wrapper.FlyControls;
    SelectionBox = wrapper.SelectionBox;
    BufferGeometryUtils = wrapper.BufferGeometryUtils;

    GLTFLoader = wrapper.GLTFLoader;
    EXRLoader = wrapper.EXRLoader;

    EffectComposer = wrapper.EffectComposer;
    RenderPass = wrapper.RenderPass;
    SAOPass = wrapper.SAOPass;
    SSAOPass = wrapper.SSAOPass;
    ShaderPass = wrapper.ShaderPass;
    SSAARenderPass = wrapper.SSAARenderPass;
    SMAAPass = wrapper.SMAAPass;
    TAARenderPass = wrapper.TAARenderPass;

    CopyShader = wrapper.CopyShader;
    GammaCorrectionShader = wrapper.GammaCorrectionShader;
    FXAAShader = wrapper.FXAAShader;

    logDebug('Successfully dynamically loaded three.js');

    setThreeLoadingComplete(THREE);
}
setup();
