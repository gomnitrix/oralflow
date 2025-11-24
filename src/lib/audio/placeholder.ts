import { Buffer } from "buffer";

interface PlaceholderSpeechOptions {
  modelId?: string;
}

const writeString = (view: DataView, offset: number, value: string) => {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
};

const encodeWav = (samples: Int16Array, sampleRate: number): string => {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // Subchunk1Size (PCM)
  view.setUint16(20, 1, true); // AudioFormat (PCM)
  view.setUint16(22, 1, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);

  samples.forEach((sample, idx) => {
    view.setInt16(44 + idx * 2, sample, true);
  });

  return Buffer.from(buffer).toString("base64");
};

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

  return `data:audio/wav;base64,${encodeWav(samples, sampleRate)}`;
};
