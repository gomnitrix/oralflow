type MessageContentPart = {
  type?: string;
  text?: string;
  transcript?: string;
  input_text?: string;
  audio?: { data?: string; format?: string; transcript?: string };
};

export const extractTextFromContent = (content: unknown): string => {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part: MessageContentPart | string) => {
        if (typeof part === "string") return part;
        if (typeof part?.text === "string") return part.text;
        if (typeof part?.transcript === "string") return part.transcript;
        if (typeof part?.input_text === "string") return part.input_text;
        return "";
      })
      .join("");
  }
  return "";
};

export const extractTextFromMessage = (message: any): string => {
  if (!message) return "";
  const audioTranscript = message?.audio?.transcript;
  if (typeof audioTranscript === "string" && audioTranscript.trim()) {
    return audioTranscript;
  }
  return extractTextFromContent(message?.content);
};

export const extractAudioFromMessage = (message: any): { data?: string; format?: string } => {
  if (!message) return {};
  if (message?.audio?.data) {
    return { data: message.audio.data, format: message.audio.format };
  }
  const content = message?.content;
  if (Array.isArray(content)) {
    for (const part of content as MessageContentPart[]) {
      const audio = part?.audio;
      if (audio?.data) {
        return { data: audio.data, format: audio.format };
      }
    }
  }
  return {};
};
