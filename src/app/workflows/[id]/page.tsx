import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import WorkflowEditor from "@/components/workflow-editor";
import { getWorkflow } from "@/lib/workflow-service";

export default async function WorkflowEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workflow = (() => {
    try {
      return getWorkflow(id);
    } catch {
      return null;
    }
  })();

  if (!workflow) {
    notFound();
  }

  return (
    <AppShell>
      <WorkflowEditor workflow={workflow} />
    </AppShell>
  );
}
