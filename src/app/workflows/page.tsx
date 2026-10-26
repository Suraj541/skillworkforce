import Link from "next/link";

import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { createWorkflow, deleteWorkflow, listWorkflows } from "@/lib/workflow-service";

export default function WorkflowsPage() {
  const workflows = listWorkflows();

  async function createAction() {
    "use server";
    const workflow = createWorkflow({
      name: "New workflow",
      description: "",
      nodes: [
        {
          id: crypto.randomUUID(),
          type: "existing-skill",
          position: { x: 100, y: 120 },
          config: {},
          version: 1,
        },
      ],
      edges: [],
    });
    redirect(`/workflows/${workflow.id}`);
  }

  async function deleteAction(formData: FormData) {
    "use server";
    const id = String(formData.get("id"));
    deleteWorkflow(id);
  }

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Workflows</h2>
        <form action={createAction}>
          <button className="rounded bg-blue-600 px-4 py-2 text-sm">Create workflow</button>
        </form>
      </div>
      <ul className="space-y-3">
        {workflows.map((workflow) => (
          <li key={workflow.id} className="rounded border border-zinc-800 bg-zinc-900 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{workflow.name}</p>
                <p className="text-sm text-zinc-400">{workflow.description || "No description"}</p>
              </div>
              <div className="flex gap-2 text-sm">
                <Link href={`/workflows/${workflow.id}`} className="rounded bg-zinc-700 px-3 py-1">
                  Open
                </Link>
                <form action={deleteAction}>
                  <input type="hidden" name="id" value={workflow.id} />
                  <button className="rounded bg-red-600 px-3 py-1">Delete</button>
                </form>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {workflows.length === 0 ? <p className="text-zinc-400">No workflows created yet.</p> : null}
    </AppShell>
  );
}
