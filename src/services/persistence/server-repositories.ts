import { InMemoryStorageAdapter, StorageAdapter } from "./storage-adapter";
import {
    ScenarioRepository,
    ConversationSessionRepository,
    EvaluationRecordRepository,
    SessionEvaluationReportRepository,
    NotebookRepository,
    ReviewTaskRepository,
    ReviewCardRepository,
} from "./repositories";

export const createServerRepositories = (adapter?: StorageAdapter) => {
    let persistentAdapter = adapter;
    let volatileAdapter = adapter;

    if (!adapter) {
        persistentAdapter = new InMemoryStorageAdapter();
        // Always use in-memory for evaluations as they don't need long-term persistence
        volatileAdapter = new InMemoryStorageAdapter();
    }

    // Fallback for TypeScript if adapter was passed (volatileAdapter is same as persistent)
    if (!persistentAdapter || !volatileAdapter) {
        throw new Error("Failed to initialize adapters");
    }

    return {
        // Scenarios and notebook now use SQLite-backed repo when no adapter is provided.
        scenarios: adapter ? new ScenarioRepository(adapter) : new ScenarioRepository(),
        sessions: new ConversationSessionRepository(persistentAdapter),
        evaluationRecords: new EvaluationRecordRepository(volatileAdapter),
        evaluationReports: new SessionEvaluationReportRepository(volatileAdapter),
        notebook: adapter ? new NotebookRepository(adapter) : new NotebookRepository(),
        reviewTasks: adapter ? new ReviewTaskRepository(adapter) : new ReviewTaskRepository(),
        reviewCards: adapter ? new ReviewCardRepository(adapter) : new ReviewCardRepository(),
    };
};
