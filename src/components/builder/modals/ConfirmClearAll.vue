<template>
    <Window size="w-max">
        <template #big-title>Clear all</template>
         <div class="my-4">
            <p>All work will be cleared.</p>
        </div>
        <div class="flex justify-between gap-4">
            <Btn @click="$emit('close', false)">Cancel</Btn>
            <Btn @click="$emit('close', true)">Confirm Clear</Btn>
        </div>
    </Window>
</template>
