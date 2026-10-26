import { errorResponse } from "@/lib/error";
import { workflowCreateSchema } from "@/lib/schemas";
import { createWorkflow, listWorkflows } from "@/lib/workflow-service";

export async function GET() {
  try {
    return Response.json({ data: listWorkflows() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = workflowCreateSchema.parse(await request.json());
    const workflow = createWorkflow(body);
    return Response.json({ data: workflow }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
