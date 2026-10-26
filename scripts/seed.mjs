import { db } from "../src/lib/db.ts";
const skills = [
  ["prompt-engineering", "Structure a request with role, context, task, constraints, quality criteria, and a final requirements check."],
  ["taste-curation", "Compare an output to reference examples, derive criteria, and rank the three most important gaps."],
  ["master-prompt-builder", "Interview for stable context, goals, tools, constraints, and quality preferences without requesting secrets."],
  ["output-iteration", "Revise a draft using specific feedback while preserving working parts and verifying again."],
  ["reusable-instruction-generator", "Turn a verified process into reusable instructions with inputs, steps, quality, and failure handling."],
  ["critical-review", "Rank assumptions, risks, costs, missing requirements, alternatives, and evidence needed."],
  ["context-compression", "Compress context while preserving facts, constraints, decisions, risks, and exceptions."],
  ["knowledge-base-curation", "Organize project source-of-truth files, versions, decisions, and test reports."],
  ["personalized-learning", "Adapt explanations and exercises to learner level and evaluate independent application."]
];
for (const [name, description] of skills) db.prepare("INSERT INTO skills VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(name) DO NOTHING").run(name, name, description, `# ${name}\n\n${description}\n\n## Quality checks\n- Verify against the source SOP before reuse.`, "AI Usage SOP Pack", 1);
console.log(`Seeded ${skills.length} idempotent core SOP skills.`);
