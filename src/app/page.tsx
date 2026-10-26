import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { listRuns, listSkills, listWorkflows } from "@/lib/workflow-service";

export default function DashboardPage() {
  const workflows = listWorkflows();
  const runs = listRuns() as Array<Record<string, unknown>>;
  const skills = listSkills();

  return (
    <AppShell>
      <h2 className="mb-4 text-2xl font-semibold">Dashboard</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm text-zinc-400">Workflows</p>
          <p className="text-2xl font-semibold">{workflows.length}</p>
        </div>
        <div className="rounded border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm text-zinc-400">Runs</p>
          <p className="text-2xl font-semibold">{runs.length}</p>
        </div>
        <div className="rounded border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm text-zinc-400">Skills</p>
          <p className="text-2xl font-semibold">{skills.length}</p>
        </div>
      </div>
      <div className="mt-6 rounded border border-zinc-800 bg-zinc-900 p-4">
        <h3 className="mb-2 text-lg font-medium">Recent Runs</h3>
        <ul className="space-y-2 text-sm">
          {runs.slice(0, 5).map((run) => (
            <li key={String(run.id)} className="flex items-center justify-between rounded bg-zinc-800 px-3 py-2">
              <span>{String(run.workflowId)}</span>
              <span className="text-zinc-300">{String(run.status)}</span>
              <Link href={`/runs/${String(run.id)}`} className="text-blue-300 hover:underline">
                Open
              </Link>
            </li>
          ))}
          {runs.length === 0 ? <li className="text-zinc-400">No runs yet.</li> : null}
        </ul>
      </div>
    </AppShell>
  );
}
