interface PlaceholderSpeechOptions {
  modelId?: string;
}

import { encodeWavBase64 } from "./wav";

/**
 * Generates a lightweight WAV data URL so bubbles have replayable audio without calling a TTS provider.
 */
export const synthesizePlaceholderSpeech = (text: string, opts?: PlaceholderSpeechOptions): string => {
  const safeText = text || "";
  const sampleRate = 16000;
  const durationSeconds = Math.min(1.6, Math.max(0.35, safeText.length / 80));
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const samples = new Int16Array(totalSamples);

  const baseFreq = 420 + ((opts?.modelId?.length ?? 7) % 90);
  for (let i = 0; i < totalSamples; i += 1) {
    const t = i / sampleRate;
    const freq = baseFreq + 30 * Math.sin(t * Math.PI * 2);
    const amplitude = 0.25 * Math.sin((i / totalSamples) * Math.PI);
    samples[i] = Math.round(Math.sin(2 * Math.PI * freq * t) * amplitude * 0x7fff);
  }

  return `data:audio/wav;base64,${encodeWavBase64(samples, sampleRate)}`;
};
