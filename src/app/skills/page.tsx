import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { listSkills } from "@/lib/workflow-service";

export default function SkillsPage() {
  const skills = listSkills() as Array<Record<string, string>>;
  return (
    <AppShell>
      <h2 className="mb-4 text-2xl font-semibold">Skill Library</h2>
      <ul className="space-y-3">
        {skills.map((skill) => (
          <li key={skill.id} className="rounded border border-zinc-800 bg-zinc-900 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{skill.name}</p>
                <p className="text-sm text-zinc-400">{skill.description}</p>
              </div>
              <Link href={`/skills/${skill.id}`} className="text-sm text-blue-300 hover:underline">
                Open
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
