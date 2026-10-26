import { z } from "zod";

export const workflowNodeSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    "existing-skill",
    "compose-skill",
    "metadata-validator",
    "security-scan",
    "acceptance-gate",
    "export-zip",
  ]),
  position: z.object({ x: z.number(), y: z.number() }),
  config: z.record(z.string(), z.unknown()),
  version: z.number().int().positive(),
});

export const workflowEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: z.string().nullable().optional(),
  targetHandle: z.string().nullable().optional(),
  branchLabel: z.string().nullable().optional(),
});

export const workflowCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  nodes: z.array(workflowNodeSchema).default([]),
  edges: z.array(workflowEdgeSchema).default([]),
});

export const workflowPatchSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  nodes: z.array(workflowNodeSchema).optional(),
  edges: z.array(workflowEdgeSchema).optional(),
});

export const runRequestSchema = z.object({
  trigger: z.enum(["manual", "api"]).default("manual"),
});
