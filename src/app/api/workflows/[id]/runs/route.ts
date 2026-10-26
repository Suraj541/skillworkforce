import { errorResponse } from "@/lib/error";
import { runRequestSchema } from "@/lib/schemas";
import { createRun, listRuns } from "@/lib/workflow-service";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    return Response.json({ data: listRuns(id) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    runRequestSchema.parse(await request.json().catch(() => ({ trigger: "manual" })));
    return Response.json({ data: createRun(id) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
