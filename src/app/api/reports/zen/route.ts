import { NextResponse } from "next/server";
import { createServerRepositories } from "../../../../services/persistence/server-repositories";
import { buildSessionReport } from "../../../../domains/evaluation/report-builder";

const repositories = createServerRepositories();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sessionId = body.sessionId as string | undefined;
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const evaluations = await repositories.evaluationRecords.list();
    const sessionRecords = evaluations.filter((record) => record.bubbleId.startsWith(sessionId));

    const report = buildSessionReport({
      sessionId,
      evaluationRecords: sessionRecords,
    });
    await repositories.evaluationReports.upsert(report);

    return NextResponse.json({ report });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
