import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { getSkill } from "@/lib/workflow-service";

export default async function SkillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const skill = (() => {
    try {
      return getSkill(id) as Record<string, string>;
    } catch {
      return null;
    }
  })();

  if (!skill) {
    notFound();
  }

  return (
    <AppShell>
      <h2 className="mb-2 text-2xl font-semibold">{skill.name}</h2>
      <p className="mb-4 text-zinc-300">{skill.description}</p>
      <div className="space-y-3 rounded border border-zinc-800 bg-zinc-900 p-4 text-sm">
        <p><span className="text-zinc-400">Slug:</span> {skill.slug}</p>
        <p><span className="text-zinc-400">Source:</span> {skill.sourceKind}</p>
        <p><span className="text-zinc-400">Audit note:</span> {skill.sourceNote}</p>
        <p><span className="text-zinc-400">Last updated:</span> {skill.updatedAt}</p>
      </div>
    </AppShell>
  );
}
