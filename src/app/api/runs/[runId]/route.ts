import { errorResponse } from "@/lib/error";
import { getRun } from "@/lib/workflow-service";

export async function GET(_: Request, context: { params: Promise<{ runId: string }> }) {
  try {
    const { runId } = await context.params;
    return Response.json({ data: getRun(runId) });
  } catch (error) {
    return errorResponse(error);
  }
}
