import { errorResponse } from "@/lib/error";
import { getSkill } from "@/lib/workflow-service";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    return Response.json({ data: getSkill(id) });
  } catch (error) {
    return errorResponse(error);
  }
}
