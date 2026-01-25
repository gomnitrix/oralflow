import { NextRequest, NextResponse } from "next/server";
import { createServerRepositories } from "../../../../services/persistence/server-repositories";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const notebookItemId = searchParams.get("notebookItemId");

    if (!notebookItemId) {
        return NextResponse.json({ error: "Missing notebookItemId" }, { status: 400 });
    }

    const repos = createServerRepositories();
    const cards = await repos.reviewCards.listByItem(notebookItemId);

    return NextResponse.json({ cards });
}

export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const repos = createServerRepositories();
    await repos.reviewCards.delete(id);

    return NextResponse.json({ success: true });
}
