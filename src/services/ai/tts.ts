import { Buffer } from "buffer";

import { createOpenAIClient, resolveModelForCapability } from "./model-routing";
import { type ProviderType } from "./provider-manager";
import { type AssignmentCapability } from "./settings";
import { extractAudioFromMessage, extractTextFromMessage } from "./message-normalizer";

export interface TtsResult {
  audioUrl: string;
  provider: ProviderType;
  model: string;
}

export const synthesizeSpeech = async (
  text: string,
  capability: AssignmentCapability = "stw_tts"
): Promise<TtsResult> => {
  const { provider, model } = resolveModelForCapability(capability, { categoryOverride: "tts", fallbackModel: "gpt-4o-mini-tts" });
  const client = createOpenAIClient(provider);

  try {
    const response = await client.audio.speech.create({
      model,
      input: text,
      voice: "alloy",
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    const audioUrl = `data:audio/mpeg;base64,${buffer.toString("base64")}`;
    return { audioUrl, provider, model };
  } catch (error) {
    const requestPayload = {
      model,
      modalities: ["audio", "text"] as const,
      audio: { voice: "alloy", format: "mp3" },
      messages: [
        { role: "system", content: "You are a text-to-speech engine. Return audio output for the provided text." },
        { role: "user", content: text },
      ],
      temperature: 0,
      stream: true,
    };
    if (provider === "openrouter") {
      console.log("[openrouter:tts] request", JSON.stringify(requestPayload));
    }

    const completion = await client.chat.completions.create(requestPayload as any);

    let audioData = "";
    let audioFormat = "mp3";
    let fallbackText = "";

    const stream = completion as any;
    for await (const chunk of stream) {
      const delta = chunk?.choices?.[0]?.delta as any;
      if (!delta) continue;

      const audio = delta.audio || delta.output_audio;
      if (audio?.data) {
        audioData += audio.data;
        if (audio.format) audioFormat = audio.format;
      }

      const content = delta.content;
      if (typeof content === "string") {
        fallbackText += content;
      } else if (Array.isArray(content)) {
        for (const part of content) {
          if (typeof part?.text === "string") {
            fallbackText += part.text;
          } else if (typeof part?.transcript === "string") {
            fallbackText += part.transcript;
          }
          const partAudio = part?.audio || part?.output_audio;
          if (partAudio?.data) {
            audioData += partAudio.data;
            if (partAudio.format) audioFormat = partAudio.format;
          }
        }
      }
    }

    if (!audioData) {
      const trimmed = fallbackText.trim();
      if (provider === "openrouter") {
        console.log("[openrouter:tts] no audio data", { textPreview: trimmed.slice(0, 200) });
      }
      throw new Error(
        trimmed ? `Audio output not returned: ${trimmed}` : "Audio output not returned from provider."
      );
    }

    if (provider === "openrouter") {
      console.log("[openrouter:tts] audio received", { format: audioFormat, size: audioData.length });
    }
    const audioUrl = `data:audio/${audioFormat};base64,${audioData}`;
    return { audioUrl, provider, model };
  }
};
