import { AIClient } from "../../services/ai/client";
import { createCopilotInsight, type CopilotInsight } from "../conversation/models";
import { createStructuredNote, type StructuredNote } from "./models";
import { createExpressionSuggestion, type ExpressionSuggestion } from "../notes/models";

export interface DistillInput {
  bubbleId: string;
  transcript: string;
  difficultyLevel?: string;
}

const parseStructuredNotes = (raw: string): StructuredNote[] => {
  const cleaned = raw.trim().replace(/```json\n?|```/g, "");
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) =>
          createStructuredNote({
            id: item.id,
            content: item.content || item.phrase || item.text || "",
            explanation: {
              en: item.explanation?.en ?? item.en ?? "",
              zh: item.explanation?.zh ?? item.zh ?? "",
            },
            examples: item.examples ?? [],
          })
        )
        .filter((n) => n.content);
    }
  } catch (error) {
    // fall through
  }
  return [];
};

const notesToSuggestions = (notes: StructuredNote[]): ExpressionSuggestion[] =>
  notes.map((note) =>
    createExpressionSuggestion({
      id: `distill_${note.id}`,
      text: note.content,
      meaning: note.explanation.zh || note.explanation.en || "",
      usageNotes: note.explanation.en || "",
      examples: note.examples,
      tone: "neutral",
      origin: "stwDistill",
      linkedNotebookItemId: null,
    })
  );

export const runDistill = async (client: AIClient, input: DistillInput): Promise<CopilotInsight> => {
  const level = input.difficultyLevel || "B1+";
  const completion = await client.completeChat(
    {
      messages: [
        {
          role: "system",
          content: [
            `Extract advanced (${level}) spoken-English notes from the learner-selected text.`,
            "Prefer phrases/chunks/idioms over single words; skip trivial vocabulary.",
            "Return ONLY JSON array. Each item: {",
            "  content: string (phrase/idiom/collocation),",
            "  explanation: { en: string, zh: string },",
            "  examples: [string, string, string] // 2-3 concise spoken examples",
            "}",
            "Use natural, concise wording suitable for practice.",
          ].join("\n"),
        },
        {
          role: "user",
          content: `Selected text:\n${input.transcript}\nReturn JSON array; omit items if nothing strong enough for ${level} level.`,
        },
      ],
    },
    "copilot_distill"
  );

  const notes = parseStructuredNotes(completion.message);
  const suggestions = notesToSuggestions(notes);

  return createCopilotInsight({
    bubbleId: input.bubbleId,
    type: "distill",
    title: "Distilled Notes",
    description: `${level} phrases and chunks distilled from the selected text.`,
    suggestedExpressions: suggestions,
    structuredNotes: notes,
  });
};
