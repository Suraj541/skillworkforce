import { errorResponse } from "@/lib/error";
import { getWorkflow, validateWorkflow } from "@/lib/workflow-service";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const validation = validateWorkflow(getWorkflow(id));
    return Response.json(validation, { status: validation.valid ? 200 : 422 });
  } catch (error) {
    return errorResponse(error);
  }
}
