import { JsonFileStorageAdapter } from "./json-file-adapter";
import { InMemoryStorageAdapter, StorageAdapter } from "./storage-adapter";
import {
    ScenarioRepository,
    ConversationSessionRepository,
    EvaluationRecordRepository,
    SessionEvaluationReportRepository,
    NotebookRepository,
    ReviewTaskRepository,
} from "./repositories";

export const createServerRepositories = (adapter?: StorageAdapter) => {
    if (!adapter) {
        const storagePath = process.env.LOCAL_STORAGE_PATH;
        if (storagePath) {
            adapter = new JsonFileStorageAdapter(storagePath);
        } else {
            adapter = new InMemoryStorageAdapter();
        }
    }

    return {
        scenarios: new ScenarioRepository(adapter),
        sessions: new ConversationSessionRepository(adapter),
        evaluationRecords: new EvaluationRecordRepository(adapter),
        evaluationReports: new SessionEvaluationReportRepository(adapter),
        notebook: new NotebookRepository(adapter),
        reviewTasks: new ReviewTaskRepository(adapter),
    };
};
