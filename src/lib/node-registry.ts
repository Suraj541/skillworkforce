import type { WorkflowNodeType } from "./types";

export type NodeDefinition = {
  type: WorkflowNodeType;
  version: number;
  title: string;
  category: "source" | "composition" | "validation" | "output";
  runnable: boolean;
  requiredConfig: string[];
};

export const NODE_REGISTRY: NodeDefinition[] = [
  {
    type: "existing-skill",
    version: 1,
    title: "Existing Skill",
    category: "source",
    runnable: true,
    requiredConfig: ["skillId"],
  },
  {
    type: "compose-skill",
    version: 1,
    title: "Compose Skill",
    category: "composition",
    runnable: true,
    requiredConfig: [],
  },
  {
    type: "metadata-validator",
    version: 1,
    title: "Metadata Validator",
    category: "validation",
    runnable: true,
    requiredConfig: [],
  },
  {
    type: "security-scan",
    version: 1,
    title: "Security Heuristic Scanner",
    category: "validation",
    runnable: true,
    requiredConfig: [],
  },
  {
    type: "acceptance-gate",
    version: 1,
    title: "Acceptance Gate",
    category: "validation",
    runnable: true,
    requiredConfig: ["requireApproval"],
  },
  {
    type: "export-zip",
    version: 1,
    title: "Export Skill ZIP",
    category: "output",
    runnable: true,
    requiredConfig: ["artifactName"],
  },
];

const nodeMap = new Map(NODE_REGISTRY.map((node) => [node.type, node]));

export function getNodeDefinition(type: string) {
  return nodeMap.get(type as WorkflowNodeType);
}
