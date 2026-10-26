import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { getRun } from "@/lib/workflow-service";

export default async function RunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = (() => {
    try {
      return getRun(id);
    } catch {
      return null;
    }
  })();

  if (!run) {
    notFound();
  }

  return (
    <AppShell>
      <h2 className="mb-4 text-2xl font-semibold">Run {String(run.id)}</h2>
      <div className="space-y-2 rounded border border-zinc-800 bg-zinc-900 p-4 text-sm">
        <p>Status: {String(run.status)}</p>
        <p>Workflow: {String(run.workflowId)} v{String(run.workflowVersion)}</p>
        <p>Started: {String(run.startedAt)}</p>
        <p>Completed: {String(run.completedAt ?? "-")}</p>
      </div>
      <h3 className="mt-4 mb-2 text-lg font-medium">Node Runs</h3>
      <ul className="space-y-2 text-sm">
        {run.nodes.map((node) => (
          <li key={String(node.id)} className="rounded border border-zinc-800 bg-zinc-900 p-3">
            <p>{String(node.nodeType)} ({String(node.status)})</p>
            <p className="text-zinc-400">{node.logs.join(" | ")}</p>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
