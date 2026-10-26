import Link from "next/link";
import { ReactNode } from "react";

const navItems = [
  ["Dashboard", "/"],
  ["Workflows", "/workflows"],
  ["Skill Library", "/skills"],
  ["Discovery", "/discovery"],
  ["Projects", "/projects"],
  ["Runs", "/runs"],
  ["Security", "/security"],
  ["Settings", "/settings"],
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="w-64 border-r border-zinc-800 p-4">
          <h1 className="mb-6 text-lg font-semibold">SkillForge AI</h1>
          <nav className="space-y-1 text-sm">
            {navItems.map(([label, href]) => (
              <Link key={href} href={href} className="block rounded px-3 py-2 hover:bg-zinc-800">
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
