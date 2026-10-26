import type { NodeType, WorkflowNode } from "./types";

export const nodeCatalog: Record<NodeType, { title: string; category: string; description: string; runnable: boolean }> = {
  "skill.source": { title: "Existing Skill", category: "Source", description: "Start with a persisted skill input.", runnable: true },
  "skill.compose": { title: "Compose Skill", category: "Composition", description: "Deterministically combine instructions with provenance.", runnable: true },
  "quality.validate": { title: "Metadata & Reference Validation", category: "Governance", description: "Validate required metadata and referenced paths.", runnable: true },
  "security.scan": { title: "Security Heuristic Scan", category: "Governance", description: "Inspect content for unsafe execution patterns.", runnable: true },
  "output.export": { title: "Export Skill ZIP", category: "Output", description: "Write a portable artifact after gates pass.", runnable: true }
};

export const defaultWorkflow: { name: string; description: string; nodes: WorkflowNode[]; edges: { id: string; source: string; target: string }[] } = {
  name: "Reliable skill composition",
  description: "A verified vertical slice from skill input to gated export.",
  nodes: [
    { id: "source", type: "skill.source" as NodeType, title: nodeCatalog["skill.source"].title, x: 80, y: 170, config: { skill: "prompt-engineering" } },
    { id: "compose", type: "skill.compose" as NodeType, title: nodeCatalog["skill.compose"].title, x: 350, y: 170, config: { requirement: "Preserve provenance and add a final review checklist." } },
    { id: "validate", type: "quality.validate" as NodeType, title: nodeCatalog["quality.validate"].title, x: 620, y: 170, config: {}, },
    { id: "scan", type: "security.scan" as NodeType, title: nodeCatalog["security.scan"].title, x: 890, y: 170, config: {}, },
    { id: "export", type: "output.export" as NodeType, title: nodeCatalog["output.export"].title, x: 1160, y: 170, config: {}, }
  ],
  edges: [
    { id: "e1", source: "source", target: "compose" },
    { id: "e2", source: "compose", target: "validate" },
    { id: "e3", source: "validate", target: "scan" },
    { id: "e4", source: "scan", target: "export" }
  ]
};
