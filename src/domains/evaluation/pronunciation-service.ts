import { Buffer } from "buffer";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

import { createEvaluationRecord, type EvaluationRecord } from "../conversation/models";
import { synthesizeSpeech } from "../../services/ai/tts";

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
  const format =
    mimeType?.includes("webm") || mimeType?.includes("ogg")
      ? sdk.AudioStreamFormat.getWaveFormat(16000, 16, 1, sdk.AudioFormatTag.WEBM_OPUS)
      : sdk.AudioStreamFormat.getDefaultInputFormat();

  const pushStream = sdk.AudioInputStream.createPushStream(format);
  const audioBuffer = Buffer.from(audioBase64, "base64");
  return { pushStream, audioBuffer };
};

const parseWordScores = (rawDetail: unknown): { word: string; accuracy: number; errorType?: string | null }[] => {
  try {
    const detail = typeof rawDetail === "string" ? JSON.parse(rawDetail) : (rawDetail as any);
    const words = detail?.NBest?.[0]?.Words;
    if (!Array.isArray(words)) return [];
    return words
      .map((w: any) => ({
        word: w.Word ?? w.word ?? "",
        accuracy: Math.round(w.PronunciationAssessment?.AccuracyScore ?? w.AccuracyScore ?? 0),
        errorType: w.PronunciationAssessment?.ErrorType ?? w.ErrorType ?? null,
      }))
      .filter((w: { word: string }) => !!w.word);
  } catch (error) {
    return [];
  }
};

const runAzurePronunciationAssessment = async (input: { audioBase64: string; text: string; audioMimeType?: string | null }) => {
  const speechConfig = createSpeechConfig();
  const { pushStream, audioBuffer } = createAudioStream(input.audioBase64, input.audioMimeType);
  const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
  const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

  const pronunciationConfig = new sdk.PronunciationAssessmentConfig(
    input.text,
    sdk.PronunciationAssessmentGradingSystem.HundredMark,
    sdk.PronunciationAssessmentGranularity.Phoneme,
    true
  );
  pronunciationConfig.enableProsodyAssessment = true;
  pronunciationConfig.applyTo(recognizer);

  const results: sdk.SpeechRecognitionResult[] = [];

  await new Promise<void>((resolve, reject) => {
    const finish = () => recognizer.stopContinuousRecognitionAsync(() => resolve(), (err) => reject(err));

    recognizer.recognized = (_s, e) => {
      if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
        results.push(e.result);
      }
    };
    recognizer.canceled = (_s, e) => {
      reject(new Error(e.errorDetails || "Azure pronunciation assessment canceled."));
      finish();
    };
    recognizer.sessionStopped = () => finish();

    recognizer.startContinuousRecognitionAsync(
      () => {
        // Push audio after start to honor continuous mode semantics
        try {
          pushStream.write(audioBuffer.buffer.slice(audioBuffer.byteOffset, audioBuffer.byteOffset + audioBuffer.byteLength));
          pushStream.close();
        } catch (err) {
          reject(err as Error);
          finish();
        }
      },
      (err: unknown) => {
        const errorObj = err as any;
        const normalized =
          errorObj instanceof Error
            ? errorObj
            : new Error(typeof err === "string" ? err : "Failed to start Azure pronunciation assessment");
        reject(normalized);
      }
    );
    setTimeout(() => finish(), 15000);
  }).finally(() => recognizer.close());

  const best = results.at(-1);
  if (!best) {
    throw new Error("No speech recognized for pronunciation assessment.");
  }

  const assessment = sdk.PronunciationAssessmentResult.fromResult(best);
  const rawDetail = best.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult);
  const wordScores = parseWordScores(rawDetail);

  return {
    assessment,
    wordScores,
  };
};

const buildPronunciationIssues = (
  scores: NonNullable<EvaluationRecord["pronunciationScores"]>,
  wordScores: NonNullable<EvaluationRecord["wordScores"]>
): string[] => {
  const issues: string[] = [];
  issues.push(
    `Pronunciation ${Math.round(scores.overall ?? 0)}/100 · Accuracy ${Math.round(scores.accuracy ?? 0)}/100 · Fluency ${Math.round(
      scores.fluency ?? 0
    )}/100`
  );
  const weakWords = wordScores.filter((w) => w.accuracy < 85).slice(0, 5);
  if (weakWords.length) {
    issues.push(
      `Needs work: ${weakWords
        .map((w) => `${w.word} (${w.accuracy}/100${w.errorType ? `, ${w.errorType.toLowerCase()}` : ""})`)
        .join("; ")}`
    );
  } else {
    issues.push("Great clarity on all words tested.");
  }
  return issues;
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
      pronunciationIssues: buildPronunciationIssues(scores, result.wordScores),
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
