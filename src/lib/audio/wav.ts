import { Buffer } from "buffer";

const writeString = (view: DataView, offset: number, value: string) => {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
};

export const encodeWavBase64 = (samples: Int16Array, sampleRate: number): string => {
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

export const pcm16Base64ToWavDataUrl = (pcmBase64: string, sampleRate = 24000): string => {
  const pcmBuffer = Buffer.from(pcmBase64, "base64");
  const sampleCount = Math.floor(pcmBuffer.length / 2);
  const samples = new Int16Array(sampleCount);

  for (let i = 0; i < sampleCount; i += 1) {
    samples[i] = pcmBuffer.readInt16LE(i * 2);
  }

  return `data:audio/wav;base64,${encodeWavBase64(samples, sampleRate)}`;
};

export const pcm16BufferToWavDataUrl = (pcmBuffer: Buffer, sampleRate = 24000): string => {
  const sampleCount = Math.floor(pcmBuffer.length / 2);
  const samples = new Int16Array(sampleCount);

  for (let i = 0; i < sampleCount; i += 1) {
    samples[i] = pcmBuffer.readInt16LE(i * 2);
  }

  return `data:audio/wav;base64,${encodeWavBase64(samples, sampleRate)}`;
};
