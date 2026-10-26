import { z } from "zod";
import { nodeCatalog } from "./node-catalog";

const configSchema = z.record(z.string(), z.string().max(10_000));
const nodeTypeSchema = z.enum(["skill.source", "skill.compose", "quality.validate", "security.scan", "output.export"]);
const nodeSchema = z.object({
  id: z.string().min(1).max(100),
  type: nodeTypeSchema.refine(value => value in nodeCatalog, "Unsupported node type."),
  title: z.string().min(1).max(200),
  x: z.number().finite().min(-100_000).max(100_000),
  y: z.number().finite().min(-100_000).max(100_000),
  config: configSchema
});
const edgeSchema = z.object({
  id: z.string().min(1).max(100),
  source: z.string().min(1).max(100),
  target: z.string().min(1).max(100)
});

export const workflowGraphSchema = z.object({
  nodes: z.array(nodeSchema).max(100),
  edges: z.array(edgeSchema).max(200)
});

export const createWorkflowSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(2_000).optional()
}).strict();

export const updateWorkflowSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(2_000).optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  nodes: workflowGraphSchema.shape.nodes.optional(),
  edges: workflowGraphSchema.shape.edges.optional()
}).strict();

export function errorDetails(error: z.ZodError) {
  return error.issues.map(issue => ({ path: issue.path.join("."), message: issue.message }));
}
