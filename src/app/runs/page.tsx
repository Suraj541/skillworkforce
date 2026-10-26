import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { listRuns } from "@/lib/workflow-service";

export default function RunsPage() {
  const runs = listRuns();
  return (
    <AppShell>
      <h2 className="mb-4 text-2xl font-semibold">Runs</h2>
      <ul className="space-y-3">
        {runs.map((run) => (
          <li key={String(run.id)} className="rounded border border-zinc-800 bg-zinc-900 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span>{String(run.workflowId)}</span>
              <span>{String(run.status)}</span>
              <Link href={`/runs/${run.id}`} className="text-blue-300 hover:underline">
                Inspect
              </Link>
            </div>
          </li>
        ))}
      </ul>
      {runs.length === 0 ? <p className="text-zinc-400">No runs available.</p> : null}
    </AppShell>
  );
}
