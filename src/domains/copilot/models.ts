export interface StructuredNote {
  id: string;
  content: string;
  explanation: {
    en: string;
    zh: string;
  };
  examples: string[];
}

export const createStructuredNote = (input: Partial<StructuredNote> & Pick<StructuredNote, "content">): StructuredNote => {
  const randomId = `note_${Math.random().toString(36).slice(2, 10)}`;
  return {
    id: input.id ?? randomId,
    content: input.content.trim(),
    explanation: {
      en: input.explanation?.en?.trim() || "",
      zh: input.explanation?.zh?.trim() || "",
    },
    examples: (input.examples ?? []).filter(Boolean),
  };
};
