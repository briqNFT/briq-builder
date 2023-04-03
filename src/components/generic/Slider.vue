<script setup lang="ts">
import { ref, Ref, watch } from 'vue';
const emit = defineEmits(['update:modelValue'])

const props = withDefaults(defineProps<{
    modelValue: any,
    sideButtons?: boolean,
    showSteps?: boolean,
    showMinMax?: boolean,
    showValue?: boolean,
    min?: number,
    max?: number,
    step?: number,
}>(), {
    sideButtons: false,
    showSteps: false,
    showMinMax: false,
    showValue: true,
    min: 0,
    max: 1,
    step: 1,
});

const slider = ref(null) as unknown as Ref<HTMLDivElement>;

const active = ref(false);

const relativeValue = ref(0);
const actualValue = ref(0);

const setValue = (value: any) => {
    if (props.max === props.min) {
        relativeValue.value = 0.5;
        actualValue.value = props.min;
        emit('update:modelValue', props.min);
        return;
    }
    value = Math.max(props.min, Math.min(props.max, value));
    actualValue.value = value;
    relativeValue.value = (value - props.min) / (props.max - props.min);
    emit('update:modelValue', actualValue.value);
}

watch([props], () => {
    setValue(props.modelValue);
})

setValue(props.modelValue);

const onDown = (event: PointerEvent) => {
    if (event.button !== 0)
        return;
    active.value = true;
    slider.value.setPointerCapture(event.pointerId);
    onMove(event);
}
const onUp = (event: PointerEvent) => {
    slider.value.releasePointerCapture(event.pointerId);
    active.value = false;
}

const onMove = (event: PointerEvent) => {
    if (!active.value)
        return;
    let xV = (event.clientX - slider.value.getBoundingClientRect().x) / slider.value.getBoundingClientRect().width;
    let value = Math.max(props.min, Math.min(props.max, xV * (props.max - props.min) + props.min));
    value = Math.round(value / props.step) * props.step;
    setValue(value);
}

const onKeyDown = (event: KeyboardEvent) => {
    if (event.code === 'ArrowLeft')
        setValue(actualValue.value - 1);
    else if (event.code === 'ArrowRight')
        setValue(actualValue.value + 1);
}

</script>

<style scoped>
div > button {
    @apply px-1;
}

div[data-test="slider"]:hover [data-test="slider-toggle"], [data-test="slider-toggle"]:hover {
    @apply !shadow-md;
}
</style>

<template>
    <div class="w-full flex justify-around items-center">
        <button v-if="sideButtons" @click="setValue(actualValue - step)">&lt;</button>
        <!-- <p class="font-semibold text-sm px-0.5">{{ min }}</p> -->
        <div
            tabindex="0" data-test="slider" class="w-full h-4 relative cursor-grab"
            @keydown="onKeyDown" @pointerdown="onDown" @pointermove="onMove" @pointerup="onUp">
            <!--
                Place an invisible child with some padding to make it easier to margin the gizmos.
                For this reason, the 'slider' references is also this item, even though it's eventless.
            -->
            <div class="w-auto left-0 invisible h-full mx-2 relative" ref="slider">
                <!-- Steps are just css elements, it's easier -->
                <div v-if="showSteps" class="visible flex justify-between absolute top-0 left-0 w-full h-full">
                    <p v-for="i in Array((max - min) / step + 1)" class="h-auto my-1 ring-[1px] ring-darker"/>
                </div>
                <!-- When not showing steps, show a 'progress bar'. -->
                <div v-else class="visible absolute left-0 top-[calc(50%-2px)] h-[3px] bg-grad-light w-full"/>

                <!-- show how far along we are -->
                <div class="visible absolute left-0 top-[calc(50%-2px)] h-[3px] bg-primary" :style="{ width: `${relativeValue*100}%`}"/>
                <!--
                    Show the min/max value, overwriting the underlying steps so it looks good.
                    To make things look nice, the values are clipped if the gizmo is to the left/right of them for min+max resp.
                -->
                <template v-if="showMinMax">
                    <div
                        class="visible absolute top-0 left-0 w-full h-full flex items-center text-left"
                        :style="{ transform: `translateX(-3px)`, 'clip-path': `inset(0 ${100 - relativeValue*100}px 0 0)` }">
                        <span class="leading-none font-semibold text-xs select-none pr-[2px] ">{{ min }}</span>
                    </div>
                    <div
                        class="visible absolute top-0 left-0 w-full h-full flex justify-end items-center text-right"
                        :style="{ transform: `translateX(3px)`, 'clip-path': `inset(0 0 0 ${relativeValue*100}px)` }">
                        <span class="leading-none font-semibold text-xs select-none pl-[2px] ">{{ max }}</span>
                    </div>
                </template>
                <!-- Round gizmo -->
                <div
                    class="visible bg-white h-5 w-5 rounded-[2rem] relative top-[-0.125rem] text-black
                    font-semibold shadow-sm select-none border border-grad-light flex justify-center text-xs items-center tracking-tighter" data-test="slider-toggle"
                    :style="{ left: `${relativeValue*100}%`, transform: 'translateX(-50%)' }"
                    @pointerdown.stop="onDown" @pointermove="onMove" @pointerup="onUp">
                    <template v-if="showValue">{{ actualValue }}</template>
                </div>
            </div>
        </div>
        <!-- <p class="font-semibold text-sm px-0.5">{{ max }}</p> -->
        <button v-if="sideButtons" @click="setValue(actualValue + step)">></button>
    </div>
</template>
