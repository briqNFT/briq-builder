import wallTonkSource from '@/assets/briqout/audio/walltonk.mp3?url';
import briqoutClapSource from '@/assets/briqout/audio/briqoutclap.mp3?url';
import briqTonkSource from '@/assets/briqout/audio/briqtonk.mp3?url';
import powerupSource from '@/assets/briqout/audio/powerup.mp3?url';

async function loadAudioBuffer(ctx: AudioContext, url: string) {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    return await ctx.decodeAudioData(buffer);
}

async function playSound(ctx: AudioContext, buffer: AudioBuffer) {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
}

export async function useBriqoutAudio() {
    const ctx = new window.AudioContext();

    const wallTonkBuffer = await loadAudioBuffer(ctx, wallTonkSource);
    const briqoutClapBuffer = await loadAudioBuffer(ctx, briqoutClapSource);
    const briqTonkBuffer = await loadAudioBuffer(ctx, briqTonkSource);
    const powerupBuffer = await loadAudioBuffer(ctx, powerupSource);

    return {
        wallTonk: () => playSound(ctx, wallTonkBuffer),
        clap: () => playSound(ctx, briqoutClapBuffer),
        briqTonk: () => playSound(ctx, briqTonkBuffer),
        powerup: () => playSound(ctx, powerupBuffer),
    };
}

