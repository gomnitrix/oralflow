import { Buffer } from "buffer";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

import { createEvaluationRecord, type EvaluationRecord } from "../conversation/models";
import { synthesizeSpeech } from "../../services/ai/tts";
import { SettingsService } from "../../services/ai/settings";

const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION;
const AZURE_SPEECH_ENDPOINT = process.env.AZURE_SPEECH_ENDPOINT;

export interface PronunciationInput {
  bubbleId: string;
  text: string;
  audioUrl?: string | null;
  audioBase64?: string | null;
  audioMimeType?: string | null;
}

export interface PronunciationResult {
  record: EvaluationRecord;
  enabled: boolean;
}

const ensureAzureConfig = (): boolean => {
  return !!AZURE_SPEECH_KEY && (!!AZURE_SPEECH_REGION || !!AZURE_SPEECH_ENDPOINT);
};

const normalizeBase64Audio = (audioBase64: string): string => {
  if (!audioBase64) return "";
  const [, base64] = audioBase64.split(",");
  return (base64 || audioBase64).trim();
};

const createSpeechConfig = () => {
  if (!AZURE_SPEECH_KEY) {
    throw new Error("Azure Speech is not configured. Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION or AZURE_SPEECH_ENDPOINT.");
  }

  let speechConfig: sdk.SpeechConfig;
  if (AZURE_SPEECH_ENDPOINT) {
    speechConfig = sdk.SpeechConfig.fromEndpoint(new URL(AZURE_SPEECH_ENDPOINT), AZURE_SPEECH_KEY);
  } else if (AZURE_SPEECH_REGION) {
    speechConfig = sdk.SpeechConfig.fromSubscription(AZURE_SPEECH_KEY, AZURE_SPEECH_REGION);
  } else {
    throw new Error("Azure Speech region or endpoint is required.");
  }

  speechConfig.speechRecognitionLanguage = "en-US";
  speechConfig.setProperty(sdk.PropertyId.SpeechServiceResponse_RequestWordLevelTimestamps, "true");
  speechConfig.setProperty(sdk.PropertyId.SpeechServiceResponse_RequestDetailedResultTrueFalse, "true");
  return speechConfig;
};

const createAudioStream = (audioBase64: string, mimeType?: string | null) => {
  const normalized = normalizeBase64Audio(audioBase64);
  const audioBuffer = Buffer.from(normalized, "base64");
  if (!audioBuffer.byteLength) {
    throw new Error("Invalid audio payload for pronunciation scoring.");
  }

  const hasCompressed =
    typeof (sdk.AudioStreamFormat as any).getCompressedFormat === "function" &&
    typeof (sdk as any).AudioStreamContainerFormat !== "undefined" &&
    (mimeType?.includes("webm") || mimeType?.includes("ogg"));

  const compressedFormat =
    hasCompressed &&
    (sdk.AudioStreamFormat as any).getCompressedFormat(
      mimeType?.includes("ogg")
        ? (sdk as any).AudioStreamContainerFormat.OGG_OPUS
        : (sdk as any).AudioStreamContainerFormat.WEBM_OPUS
    );

  const format = compressedFormat || sdk.AudioStreamFormat.getDefaultInputFormat();
  const pushStream = sdk.AudioInputStream.createPushStream(format);
  return { pushStream, audioBuffer };
};

const ARPABET_TO_IPA: Record<string, string> = {
  AA: "ɑ",
  AE: "æ",
  AH: "ʌ",
  AO: "ɔ",
  AW: "aʊ",
  AY: "aɪ",
  B: "b",
  CH: "tʃ",
  D: "d",
  DH: "ð",
  EH: "ɛ",
  ER: "ɝ",
  EY: "eɪ",
  F: "f",
  G: "g",
  HH: "h",
  IH: "ɪ",
  IY: "i",
  JH: "dʒ",
  K: "k",
  L: "l",
  M: "m",
  N: "n",
  NG: "ŋ",
  OW: "oʊ",
  OY: "ɔɪ",
  P: "p",
  R: "ɹ",
  S: "s",
  SH: "ʃ",
  T: "t",
  TH: "θ",
  UH: "ʊ",
  UW: "u",
  V: "v",
  W: "w",
  Y: "j",
  Z: "z",
  ZH: "ʒ",
};

const toIPA = (phoneme: string): string => {
  const base = phoneme.replace(/[0-2]$/g, "").toUpperCase();
  return ARPABET_TO_IPA[base] ?? base.toLowerCase();
};

const parseWordScores = (rawDetail: unknown): {
  word: string;
  accuracy: number;
  errorType?: string | null;
  phonemes?: { phoneme: string; accuracy: number; ipa?: string }[];
}[] => {
  try {
    const detail = typeof rawDetail === "string" ? JSON.parse(rawDetail) : (rawDetail as any);
    const words = detail?.NBest?.[0]?.Words;
    if (!Array.isArray(words)) return [];
    return words
      .map((w: any) => ({
        word: w.Word ?? w.word ?? "",
        accuracy: Math.round(w.PronunciationAssessment?.AccuracyScore ?? w.AccuracyScore ?? 0),
        errorType: w.PronunciationAssessment?.ErrorType ?? w.ErrorType ?? null,
        phonemes: Array.isArray(w.Phonemes)
          ? w.Phonemes.map((p: any) => ({
              phoneme: p?.Phoneme ?? "",
              accuracy: Math.round(p?.PronunciationAssessment?.AccuracyScore ?? 0),
              ipa: p?.Phoneme ? toIPA(p.Phoneme) : undefined,
            })).filter((p: { phoneme: string }) => !!p.phoneme)
          : [],
      }))
      .filter((w: { word: string }) => !!w.word);
  } catch (error) {
    return [];
  }
};

const resolveGranularity = (): sdk.PronunciationAssessmentGranularity => {
  const settings = SettingsService.getInstance().getSettings();
  const configured = settings.config.pronunciation.granularity?.toLowerCase();
  if (configured === "word") return sdk.PronunciationAssessmentGranularity.Word;
  if (configured === "fulltext") return sdk.PronunciationAssessmentGranularity.FullText;
  return sdk.PronunciationAssessmentGranularity.Phoneme;
};

const runAzurePronunciationAssessment = async (input: { audioBase64: string; text: string; audioMimeType?: string | null }) => {
  const speechConfig = createSpeechConfig();
  const { pushStream, audioBuffer } = createAudioStream(input.audioBase64, input.audioMimeType);
  const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
  const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

  // Unscripted assessment: empty referenceText so Azure uses recognized speech, not provided transcript
  const pronunciationConfig = new sdk.PronunciationAssessmentConfig(
    "",
    sdk.PronunciationAssessmentGradingSystem.HundredMark,
    resolveGranularity(),
    true
  );
  pronunciationConfig.enableProsodyAssessment = true;
  // Enable miscue tagging per request (only applicable when reference text is supplied, kept on for completeness)
  (pronunciationConfig as any).enableMiscue = true;
  pronunciationConfig.applyTo(recognizer);

  console.log("[azure:pronunciation] start", {
    mimeType: input.audioMimeType,
    byteLength: audioBuffer.byteLength,
    textPreview: input.text.slice(0, 80),
    granularity: sdk.PronunciationAssessmentGranularity[resolveGranularity()],
  });

  try {
    const result = await new Promise<sdk.SpeechRecognitionResult>((resolve, reject) => {
      recognizer.recognizeOnceAsync(
        (res) => {
          resolve(res);
        },
        (err) => {
          reject(err);
        }
      );

      try {
        pushStream.write(audioBuffer.buffer.slice(audioBuffer.byteOffset, audioBuffer.byteOffset + audioBuffer.byteLength));
        pushStream.close();
      } catch (err) {
        reject(err as Error);
      }
      setTimeout(() => reject(new Error("Azure pronunciation assessment timeout.")), 15000);
    });

    if (result.reason === sdk.ResultReason.NoMatch) {
      throw new Error("No speech recognized for pronunciation assessment.");
    }
    if (result.reason === sdk.ResultReason.Canceled) {
      const cancellation = sdk.CancellationDetails.fromResult(result);
      console.error("[azure:pronunciation] canceled", {
        reason: cancellation.reason,
        reasonText: sdk.CancellationReason[cancellation.reason],
        errorDetails: cancellation.errorDetails,
      });
      throw new Error(cancellation.errorDetails || "Azure pronunciation assessment canceled.");
    }

    const assessment = sdk.PronunciationAssessmentResult.fromResult(result);
    const rawDetail = result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult);
    console.log("[azure:pronunciation] best result", {
      duration: result.duration,
      offset: result.offset,
      pronunciationScore: assessment?.pronunciationScore,
      fluencyScore: assessment?.fluencyScore,
      accuracyScore: assessment?.accuracyScore,
      completenessScore: assessment?.completenessScore,
      raw: rawDetail,
    });
    const wordScores = parseWordScores(rawDetail);

    return {
      assessment,
      wordScores,
    };
  } finally {
    recognizer.close();
  }
};

export const evaluatePronunciation = async (input: PronunciationInput): Promise<PronunciationResult> => {
  if (!ensureAzureConfig()) {
    const record = createEvaluationRecord({
      bubbleId: input.bubbleId,
      pronunciationIssues: ["Pronunciation assessment requires Azure Speech credentials."],
      grammarIssues: [],
      naturalnessNotes: [],
      nativeLikeSuggestion: "",
      referenceAudioUrl: input.audioUrl ?? null,
    });
    return { record, enabled: false };
  }

  if (!input.audioBase64) {
    const record = createEvaluationRecord({
      bubbleId: input.bubbleId,
      pronunciationIssues: ["Missing audio for pronunciation scoring."],
      grammarIssues: [],
      naturalnessNotes: [],
      nativeLikeSuggestion: "",
      referenceAudioUrl: input.audioUrl ?? null,
    });
    return { record, enabled: false };
  }

  let referenceAudioUrl: string | null = null;
  try {
    const tts = await synthesizeSpeech(input.text, "stw_tts");
    referenceAudioUrl = tts.audioUrl;
  } catch (error) {
    referenceAudioUrl = input.audioUrl ?? null;
  }

  try {
    const result = await runAzurePronunciationAssessment({
      audioBase64: input.audioBase64,
      audioMimeType: input.audioMimeType,
      text: input.text,
    });

    const scores = {
      overall: result.assessment?.pronunciationScore ?? 0,
      accuracy: result.assessment?.accuracyScore ?? 0,
      fluency: result.assessment?.fluencyScore ?? 0,
      completeness: result.assessment?.completenessScore ?? 0,
      prosody: result.assessment?.prosodyScore ?? undefined,
    };

    const record = createEvaluationRecord({
      bubbleId: input.bubbleId,
      pronunciationIssues: [],
      pronunciationScores: scores,
      wordScores: result.wordScores,
      grammarIssues: [],
      naturalnessNotes: [],
      nativeLikeSuggestion: "",
      referenceAudioUrl,
    });

    return { record, enabled: true };
  } catch (error) {
    const record = createEvaluationRecord({
      bubbleId: input.bubbleId,
      pronunciationIssues: [(error as Error).message || "Pronunciation assessment failed."],
      grammarIssues: [],
      naturalnessNotes: [],
      nativeLikeSuggestion: "",
      referenceAudioUrl,
    });
    return { record, enabled: false };
  }
};
