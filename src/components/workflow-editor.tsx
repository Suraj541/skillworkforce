"use client";

import { useMemo, useState } from "react";
import {
  addEdge,
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

type Workflow = {
  id: string;
  name: string;
  description: string;
  status: string;
  nodes: Array<{ id: string; type: string; position: { x: number; y: number }; config: Record<string, unknown>; version: number }>;
  edges: Array<{ id: string; source: string; target: string; sourceHandle?: string | null; targetHandle?: string | null }>;
};

function toFlowNodes(nodes: Workflow["nodes"]): Node[] {
  return nodes.map((node) => ({
    id: node.id,
    type: "default",
    position: node.position,
    data: { label: node.type },
  }));
}

function toFlowEdges(edges: Workflow["edges"]): Edge[] {
  return edges.map((edge) => ({ id: edge.id, source: edge.source, target: edge.target }));
}

export default function WorkflowEditor({ workflow }: { workflow: Workflow }) {
  const [nodes, , onNodesChange] = useNodesState<Node>(toFlowNodes(workflow.nodes));
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(toFlowEdges(workflow.edges));
  const [status, setStatus] = useState<string>("idle");
  const [issues, setIssues] = useState<Array<{ code: string; message: string }>>([]);

  const nodeConfigs = useMemo(() => {
    return workflow.nodes.reduce<Record<string, Record<string, unknown>>>((acc, node) => {
      acc[node.id] = node.config;
      return acc;
    }, {});
  }, [workflow.nodes]);

  const nodeTypes = useMemo(() => {
    return workflow.nodes.reduce<Record<string, string>>((acc, node) => {
      acc[node.id] = node.type;
      return acc;
    }, {});
  }, [workflow.nodes]);

  const onConnect = (connection: Connection) => {
    setEdges((current) => addEdge({ ...connection, id: crypto.randomUUID() }, current));
  };

  async function save() {
    setStatus("saving");
    const payload = {
      nodes: nodes.map((node) => ({
        id: node.id,
        type: (nodeTypes[node.id] ?? "compose-skill") as Workflow["nodes"][number]["type"],
        position: node.position,
        config: nodeConfigs[node.id] ?? {},
        version: 1,
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
      })),
    };

    const response = await fetch(`/api/workflows/${workflow.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setStatus("save-failed");
      return;
    }

    setStatus("saved");
  }

  async function validate() {
    setStatus("validating");
    const response = await fetch(`/api/workflows/${workflow.id}/validate`, { method: "POST" });
    const json = await response.json();
    setIssues(json.issues ?? []);
    setStatus(json.valid ? "valid" : "invalid");
  }

  async function run() {
    setStatus("running");
    const response = await fetch(`/api/workflows/${workflow.id}/runs`, { method: "POST" });
    const json = await response.json();
    setStatus(response.ok ? `run:${json.status}` : "run-failed");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm">
        <span>{workflow.name}</span>
        <div className="flex gap-2">
          <button onClick={validate} className="rounded bg-zinc-700 px-3 py-1">Validate</button>
          <button onClick={save} className="rounded bg-blue-600 px-3 py-1">Save</button>
          <button onClick={run} className="rounded bg-emerald-600 px-3 py-1">Run</button>
        </div>
      </div>

      <div className="h-[65vh] rounded border border-zinc-700 bg-zinc-900">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Background gap={20} size={1} />
          <MiniMap />
          <Controls />
        </ReactFlow>
      </div>

      <div className="rounded border border-zinc-700 bg-zinc-900 p-3 text-sm">
        <p>Status: {status}</p>
        {issues.length > 0 ? (
          <ul className="mt-2 list-disc pl-6">
            {issues.map((issue, index) => (
              <li key={`${issue.code}-${index}`}>{issue.code}: {issue.message}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-zinc-400">No validation issues currently shown.</p>
        )}
      </div>
    </div>
  );
}
