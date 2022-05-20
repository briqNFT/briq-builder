<template>
    <Window>
        <template #big-title>Unbox</template>
        <p>You will be given some briqs & a notice</p>
        <Btn @click="$emit('close', true)">Unbox</Btn>
    </Window>
</template>