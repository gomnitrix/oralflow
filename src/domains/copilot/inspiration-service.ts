import { AIClient } from "../../services/ai/client";
import { createCopilotInsight, type CopilotInsight } from "../conversation/models";
import { createStructuredNote, type StructuredNote } from "./models";
import { createExpressionSuggestion, type ExpressionSuggestion } from "../notes/models";

export interface InspirationInput {
  bubbleId: string;
  topic: string;
  history?: { speaker: "user" | "ai"; text: string }[];
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
    // ignore
  }
  return [];
};

const notesToSuggestions = (notes: StructuredNote[]): ExpressionSuggestion[] =>
  notes.map((note) =>
    createExpressionSuggestion({
      id: `inspire_${note.id}`,
      text: note.content,
      meaning: note.explanation.zh || note.explanation.en || "",
      usageNotes: note.explanation.en || "",
      examples: note.examples,
      tone: "neutral",
      origin: "stwInspiration",
      linkedNotebookItemId: null,
    })
  );

export const runInspirationBurst = async (
  client: AIClient,
  input: InspirationInput
): Promise<CopilotInsight> => {
  const historyText = (input.history ?? [])
    .map((turn, idx) => `${idx + 1}. ${turn.speaker === "ai" ? "Coach" : "You"}: ${turn.text}`)
    .join("\n");

  const completion = await client.completeChat(
    {
      messages: [
        {
          role: "system",
          content: [
            "Suggest ways the learner can continue the conversation from here.",
            "Return ONLY JSON array. Each item: {",
            "  content: string (phrase/idiom/collocation),",
            "  explanation: { en: string, zh: string },",
            "  examples: [string, string, string] // first example must be a sentence the learner can say next",
            "}",
            "Level: B1+; avoid isolated single words; prioritize natural spoken turns.",
          ].join("\n"),
        },
        {
          role: "user",
          content: `Conversation so far:\n${historyText || "(no history)"}\nCurrent turn topic: ${input.topic}\nReturn JSON array of 2-4 entries; skip trivial items.`,
        },
      ],
    },
    "copilot_inspiration"
  );

  const notes = parseStructuredNotes(completion.message);
  const suggestions = notesToSuggestions(notes);

  return createCopilotInsight({
    bubbleId: input.bubbleId,
    type: "inspiration",
    title: "Inspiration Burst",
    description: "Next-turn ideas you can say now.",
    suggestedExpressions: suggestions,
    structuredNotes: notes,
  });
};
