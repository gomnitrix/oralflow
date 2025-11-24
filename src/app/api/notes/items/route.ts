import { NextResponse } from "next/server";
import { notebookItemSchema } from "../../../../lib/validation/notes";
import { NotebookRepository } from "../../../../services/persistence/repositories";
import { NotebookService } from "../../../../domains/notes/notebook-service";
import { createNotebookItem } from "../../../../domains/notes/models";
import { createServerRepositories } from "../../../../services/persistence/server-repositories";

const repositories = createServerRepositories();
const notebookRepo: NotebookRepository = repositories.notebook;
const notebookService = new NotebookService({ repository: notebookRepo });

export async function GET() {
  const items = await notebookService.list();
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = notebookItemSchema.parse(body);
    const item = createNotebookItem(parsed);
    await notebookRepo.upsert(item);
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  await notebookService.delete(id);
  return new NextResponse(null, { status: 204 });
}
