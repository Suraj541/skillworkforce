import { errorResponse } from "@/lib/error";
import { workflowPatchSchema } from "@/lib/schemas";
import { deleteWorkflow, getWorkflow, updateWorkflow } from "@/lib/workflow-service";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    return Response.json({ data: getWorkflow(id) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = workflowPatchSchema.parse(await request.json());
    return Response.json({ data: updateWorkflow(id, body) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    deleteWorkflow(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
