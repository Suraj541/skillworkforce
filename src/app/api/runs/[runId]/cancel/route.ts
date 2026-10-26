import { errorResponse } from "@/lib/error";
import { cancelRun } from "@/lib/workflow-service";

export async function POST(_: Request, context: { params: Promise<{ runId: string }> }) {
  try {
    const { runId } = await context.params;
    return Response.json({ data: cancelRun(runId) });
  } catch (error) {
    return errorResponse(error);
  }
}
