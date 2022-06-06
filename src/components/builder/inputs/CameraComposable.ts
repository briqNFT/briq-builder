import { ref, computed, watchEffect, onBeforeMount } from 'vue'

import { dispatchBuilderAction } from '../../../builder/graphics/Dispatch';

import { camera } from '@/builder/graphics/Builder';
import { orbitControls } from '@/builder/graphics/Builder';

import { builderInputFsm } from '@/builder/inputs/BuilderInput';

import { THREE } from '@/three';

const fsm = builderInputFsm.gui;

export function usePresetHelpers() {
    const presets = ref([]);

    const editing = ref("");
    const editingName = ref("");

    onBeforeMount(() => {
        let data = window.localStorage.getItem('briq_camera_presets');
        try {
            presets.value = JSON.parse(data!).data;
        } catch(e) {
            window.localStorage.removeItem('briq_camera_presets');
        }
    
        watchEffect(() => {
            window.localStorage.setItem('briq_camera_presets', JSON.stringify({
                version: 1,
                data: presets.value,
            }))
        });
    })

    const usePreset = (preset) => {
        camera.position.set(...preset.position);
        orbitControls.controls.target = new THREE.Vector3(...preset.target);
        fov.value = +preset.fov;
        camera.updateProjectionMatrix();
    };

    const deletePreset = (preset) => {
        presets.value = presets.value.filter(x => x.name !== preset.name);
    };

    const renamePreset = (preset) => {
        editingName.value = preset.name
        editing.value = preset.name;
    }

    const isValidName = (name: string) => {
        if (name === editing.value)
            return true;
        if (presets.value.some(x => x.name === name))
            return false;
        return true;
    };

    //// FOV / Camera logic

    const fov = ref(+camera.fov);

    watchEffect(() => {
        camera.fov = +fov.value;
        camera.updateProjectionMatrix();
    })

    const _cameraSettingsCtr = ref(0);
    const cameraSettings = computed(() => {
        // Ugly, but this makes the reactivity update properly.
        _cameraSettingsCtr.value;
        return {
            position: camera.position.toArray(),
            target: orbitControls.controls.target.toArray(),
            fov: camera.fov,
        }
    });
    const updateCameraSettings = () => {
        ++_cameraSettingsCtr.value;
        fov.value = camera.fov;
        requestAnimationFrame(updateCameraSettings);
    }
    requestAnimationFrame(updateCameraSettings);

    const resetCamera = () => {
        fov.value = 75;
        dispatchBuilderAction('put_all_in_view');
        camera.updateProjectionMatrix();
    }

    const resetToPseudoIso = () => {
        fov.value = 35;
        camera.position.set(35, 35, -60);
        orbitControls.controls.target = new THREE.Vector3(0, 0, 0);
        camera.updateProjectionMatrix();
    }
    
    const centerCamera = () => {
        dispatchBuilderAction('set_camera_target', {
            target: [fsm.focusPos.x, fsm.focusPos.y, fsm.focusPos.z],
        });
        camera.updateProjectionMatrix();
    };    

    return {
        presets,
        editing,
        editingName,
        fov,
        isValidName,
        usePreset,
        deletePreset,
        renamePreset,
        cameraSettings,
        resetCamera,
        resetToPseudoIso,
        centerCamera,
    }
}