import { errorResponse } from "@/lib/error";
import { listSkills } from "@/lib/workflow-service";

export async function GET() {
  try {
    return Response.json({ data: listSkills() });
  } catch (error) {
    return errorResponse(error);
  }
}
