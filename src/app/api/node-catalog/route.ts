import { NODE_REGISTRY } from "@/lib/node-registry";

export async function GET() {
  return Response.json({ data: NODE_REGISTRY });
}
