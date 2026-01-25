import { SettingsService } from "../../services/ai/settings";
import type { NotebookItem } from "../notes/models";
import { CardGeneratorService } from "./card-generator";
import { createNotebookItem } from "../notes/models";
import {
  createReviewTask,
  createTrainingSession,
  type CardType,
  type ReviewCard,
  type ReviewTask,
  type TrainingMode,
  type TrainingSession,
} from "./models";

export interface NotebookRepositoryPort {
  list(): Promise<NotebookItem[]>;
  getById(id: string): Promise<NotebookItem | null>;
  upsert(item: NotebookItem): Promise<NotebookItem>;
}

export interface ReviewTaskRepositoryPort {
  list(): Promise<ReviewTask[]>;
  getById(id: string): Promise<ReviewTask | null>;
  upsert(task: ReviewTask): Promise<ReviewTask>;
  replaceAll(tasks: ReviewTask[]): Promise<void>;
}

export interface ReviewCardRepositoryPort {
  listByItem(notebookItemId: string): Promise<ReviewCard[]>;
  upsert(card: ReviewCard): Promise<ReviewCard>;
}

export interface TrainingSessionStartInput {
  mode: TrainingMode;
  sourceText?: string | null;
  limit?: number;
  disableNewCards?: boolean;
  lazyGeneration?: boolean;
}

export interface TrainingSessionResult {
  session: TrainingSession;
  tasks: ReviewTask[];
  cards: ReviewCard[];
  items: NotebookItem[];
}

export interface TrainingSessionSummary {
  dueItemCount: number;
  totalCardCount: number;
  existingCardCount: number;
  newCardCount: number;
}

const difficultyScale: Record<NonNullable<NotebookItem["lastDifficulty"]>, number> = {
  forgot: 1,
  hard: 2,
  good: 3,
  easy: 4,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const resolveCardCount = (item: NotebookItem): number => {
  const difficulty = item.lastDifficulty ? difficultyScale[item.lastDifficulty] : 2;
  return clamp(5 - difficulty, 1, 4);
};

const pickCardTypes = (count: number): CardType[] => {
  const ordered: CardType[] = ["answer_generation", "translation", "ask_question", "read_aloud"];
  if (ordered.length === 0) return [];
  const selected: CardType[] = [];
  for (let i = 0; i < count; i += 1) {
    selected.push(ordered[i % ordered.length]);
  }
  return selected;
};

export interface TrainingSessionDeps {
  notebook: NotebookRepositoryPort;
  reviewTasks: ReviewTaskRepositoryPort;
  reviewCards: ReviewCardRepositoryPort;
  cardGenerator: CardGeneratorService;
}

export class TrainingSessionService {
  constructor(private readonly deps: TrainingSessionDeps) { }

  async startSession(input: TrainingSessionStartInput): Promise<TrainingSessionResult> {
    if (input.mode === "adHoc") {
      const sourceText = (input.sourceText ?? "").trim();
      if (!sourceText) {
        const session = createTrainingSession({
          mode: "adHoc",
          taskIds: [],
          endedAt: null,
        });
        return { session, tasks: [], cards: [], items: [] };
      }

      const nowIso = new Date().toISOString();
      const item = createNotebookItem({
        phrase: sourceText,
        meaning: sourceText,
        usageNotes: "Ad hoc practice prompt.",
        variants: [],
        exampleSentences: [],
        contextSentence: sourceText,
        ipa: "",
        spokenNotes: "",
        source: "training",
        sourceDetails: "adHoc",
        tags: [],
        locale: "en",
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      await this.deps.notebook.upsert(item);
      const task = createReviewTask({
        notebookItemId: item.id,
        dueAt: nowIso,
        lastReviewedAt: null,
        intervalDays: 1,
        easeFactor: 2.5,
        repetitionCount: 0,
        status: "pending",
      });
      await this.deps.reviewTasks.upsert(task);

      const cardType: CardType = "read_aloud";
      const card = await this.deps.cardGenerator.generateCard(item, cardType);
      await this.deps.reviewCards.upsert(card);

      const session = createTrainingSession({
        mode: "adHoc",
        taskIds: [task.id],
        endedAt: null,
      });
      return { session, tasks: [task], cards: [card], items: [item] };
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const settings = SettingsService.getInstance().getSettings().config.training;
    const disableNewCards = input.disableNewCards ?? false;
    const lazyGeneration = input.lazyGeneration ?? false;
    const notebookItems = await this.deps.notebook.list();

    const existingTasks = await this.deps.reviewTasks.list();
    const existingByItemId = new Map(existingTasks.map((task) => [task.notebookItemId, task]));

    const mergedTasks = notebookItems.map((item) => {
      const existing = existingByItemId.get(item.id);
      if (existing) return existing;
      return createReviewTask({
        notebookItemId: item.id,
        dueAt: item.nextReviewAt ?? nowIso,
        lastReviewedAt: item.lastReviewedAt ?? null,
        intervalDays: item.intervalDays ?? 1,
        easeFactor: item.easeFactor ?? 2.5,
        repetitionCount: item.srsLevel ?? 0,
        status: "pending",
      });
    });

    await this.deps.reviewTasks.replaceAll(mergedTasks);

    const dueTasks = mergedTasks.filter((task) => {
      if (task.status !== "pending") return false;
      return new Date(task.dueAt).getTime() <= now.getTime();
    });

    const limitedTasks = input.limit ? dueTasks.slice(0, input.limit) : dueTasks;
    const itemMap = new Map(notebookItems.map((item) => [item.id, item]));

    const cards: ReviewCard[] = [];
    for (const task of limitedTasks) {
      const item = itemMap.get(task.notebookItemId);
      if (!item) continue;
      const cardCount = resolveCardCount(item);

      const newProbability = settings.newCardProbability[item.lastDifficulty ?? "hard"];
      const requestedNew = item.lastDifficulty
        ? Math.round(cardCount * newProbability)
        : Math.max(1, Math.round(cardCount * 0.5));
      const desiredNewCount = disableNewCards ? 0 : clamp(requestedNew, 0, cardCount);

      const existingCards = await this.deps.reviewCards.listByItem(item.id);
      const sortedExisting = [...existingCards].sort((a, b) => {
        const aScore = (a.usageCount ?? 0) + (a.lastUsedAt ? 0.1 : 0);
        const bScore = (b.usageCount ?? 0) + (b.lastUsedAt ? 0.1 : 0);
        return aScore - bScore;
      });

      const existingTarget = Math.max(0, cardCount - desiredNewCount);
      const selectedExisting = sortedExisting.slice(0, existingTarget);
      const missingCount = cardCount - selectedExisting.length;

      const generateCount = disableNewCards ? 0 : Math.max(desiredNewCount, missingCount);
      let generatedCards: ReviewCard[] = [];

      if (generateCount > 0) {
        const types = pickCardTypes(generateCount);
        if (lazyGeneration) {
          void this.deps.cardGenerator
            .generateCards(item, types)
            .then(async (newCards) => {
              for (const card of newCards) {
                await this.deps.reviewCards.upsert(card);
              }
            })
            .catch((error) => {
              console.warn("[training] background card generation failed", error);
            });
        } else {
          generatedCards = await this.deps.cardGenerator.generateCards(item, types);
          for (const card of generatedCards) {
            await this.deps.reviewCards.upsert(card);
          }
        }
      }

      const sessionExisting = [...selectedExisting];
      if (lazyGeneration && sortedExisting.length > selectedExisting.length) {
        const fillCount = Math.min(cardCount - sessionExisting.length, sortedExisting.length - selectedExisting.length);
        sessionExisting.push(...sortedExisting.slice(selectedExisting.length, selectedExisting.length + fillCount));
      }

      const updatedExisting = sessionExisting.map((card) => ({
        ...card,
        lastUsedAt: nowIso,
        usageCount: (card.usageCount ?? 0) + 1,
      }));

      for (const card of updatedExisting) {
        await this.deps.reviewCards.upsert(card);
      }

      const includedGenerated = lazyGeneration
        ? []
        : generatedCards.slice(0, Math.max(0, cardCount - updatedExisting.length)).map((card) => ({
          ...card,
          lastUsedAt: nowIso,
          usageCount: (card.usageCount ?? 0) + 1,
        }));

      for (const card of includedGenerated) {
        await this.deps.reviewCards.upsert(card);
      }

      cards.push(...updatedExisting, ...includedGenerated);
    }

    const session = createTrainingSession({
      mode: input.mode,
      taskIds: limitedTasks.map((task) => task.id),
      endedAt: null,
    });

    return {
      session,
      tasks: limitedTasks,
      cards,
      items: notebookItems.filter((item) => limitedTasks.some((task) => task.notebookItemId === item.id)),
    };
  }

  async buildSummary(input: TrainingSessionStartInput): Promise<TrainingSessionSummary> {
    if (input.mode === "adHoc") {
      return { dueItemCount: 0, totalCardCount: 0, existingCardCount: 0, newCardCount: 0 };
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const settings = SettingsService.getInstance().getSettings().config.training;
    const disableNewCards = input.disableNewCards ?? false;
    const notebookItems = await this.deps.notebook.list();

    const existingTasks = await this.deps.reviewTasks.list();
    const existingByItemId = new Map(existingTasks.map((task) => [task.notebookItemId, task]));

    const mergedTasks = notebookItems.map((item) => {
      const existing = existingByItemId.get(item.id);
      if (existing) return existing;
      return createReviewTask({
        notebookItemId: item.id,
        dueAt: item.nextReviewAt ?? nowIso,
        lastReviewedAt: item.lastReviewedAt ?? null,
        intervalDays: item.intervalDays ?? 1,
        easeFactor: item.easeFactor ?? 2.5,
        repetitionCount: item.srsLevel ?? 0,
        status: "pending",
      });
    });

    const dueTasks = mergedTasks.filter((task) => {
      if (task.status !== "pending") return false;
      return new Date(task.dueAt).getTime() <= now.getTime();
    });

    const limitedTasks = input.limit ? dueTasks.slice(0, input.limit) : dueTasks;
    const itemMap = new Map(notebookItems.map((item) => [item.id, item]));

    let existingCardCount = 0;
    let newCardCount = 0;

    for (const task of limitedTasks) {
      const item = itemMap.get(task.notebookItemId);
      if (!item) continue;
      const cardCount = resolveCardCount(item);
      const newProbability = settings.newCardProbability[item.lastDifficulty ?? "hard"];
      const requestedNew = item.lastDifficulty
        ? Math.round(cardCount * newProbability)
        : Math.max(1, Math.round(cardCount * 0.5));
      const desiredNewCount = disableNewCards ? 0 : clamp(requestedNew, 0, cardCount);

      const existingCards = await this.deps.reviewCards.listByItem(item.id);
      const existingTarget = Math.max(0, cardCount - desiredNewCount);
      const usedExisting = Math.min(existingCards.length, existingTarget);
      const missingCount = cardCount - usedExisting;
      const generateCount = disableNewCards ? 0 : Math.max(desiredNewCount, missingCount);

      existingCardCount += Math.min(existingCards.length, cardCount);
      newCardCount += generateCount;
    }

    return {
      dueItemCount: limitedTasks.length,
      totalCardCount: existingCardCount + newCardCount,
      existingCardCount,
      newCardCount,
    };
  }
}
