export const SOP_SEED_VERSION = "2026-10-26";

export type SopSkill = {
  slug: string;
  title: string;
  description: string;
  kind: "core" | "expanded";
};

export const SOP_SKILLS: SopSkill[] = [
  { slug: "prompt-engineering", title: "Prompt Engineering", description: "Role, context, task, constraints, and quality checks.", kind: "core" },
  { slug: "taste-curation", title: "Taste Curation", description: "Compare output quality against trusted references.", kind: "core" },
  { slug: "master-prompt-builder", title: "Master Prompt Builder", description: "Interview for stable context and quality preferences.", kind: "core" },
  { slug: "output-iteration", title: "Output Iteration", description: "Revise drafts with minimal targeted edits.", kind: "core" },
  { slug: "reusable-instruction-generator", title: "Reusable Instruction Generator", description: "Convert successful process into reusable SOP.", kind: "core" },
  { slug: "critical-review", title: "Critical Review", description: "Skeptical review of assumptions, risk and alternatives.", kind: "core" },
  { slug: "context-compression", title: "Context Compression", description: "Compress context while preserving evidence-critical facts.", kind: "core" },
  { slug: "knowledge-base-curation", title: "Knowledge Base Curation", description: "Organize source-of-truth assets and archive stale context.", kind: "core" },
  { slug: "personalized-learning", title: "Personalized Learning", description: "Adaptive learning flow with exercise and validation.", kind: "core" },
  { slug: "feature-planning-workflow", title: "Feature Planning Workflow", description: "Plan feature scope and acceptance criteria.", kind: "expanded" },
  { slug: "debugging-workflow", title: "Debugging Workflow", description: "Structured triage and fix verification path.", kind: "expanded" },
  { slug: "release-readiness-review", title: "Release Readiness Review", description: "Release checklist and blocker review workflow.", kind: "expanded" },
  { slug: "stakeholder-update-composer", title: "Stakeholder Update Composer", description: "Compose clear status updates with evidence.", kind: "expanded" },
  { slug: "meeting-notes-to-plan", title: "Meeting Notes to Plan", description: "Convert notes into executable action plan.", kind: "expanded" },
  { slug: "requirements-clarification", title: "Requirements Clarification", description: "Find ambiguity and propose concrete questions.", kind: "expanded" },
  { slug: "api-contract-review", title: "API Contract Review", description: "Check endpoint schema consistency and failure handling.", kind: "expanded" },
  { slug: "test-strategy-builder", title: "Test Strategy Builder", description: "Build unit, integration and e2e test plan.", kind: "expanded" },
  { slug: "retrospective-facilitator", title: "Retrospective Facilitator", description: "Guide retrospective findings and actionable outcomes.", kind: "expanded" },
  { slug: "risk-register-maintenance", title: "Risk Register Maintenance", description: "Capture risks, owners, triggers, and mitigations.", kind: "expanded" },
  { slug: "incident-summary", title: "Incident Summary", description: "Summarize incidents with timeline and corrective actions.", kind: "expanded" },
  { slug: "architecture-review-workflow", title: "Architecture Review Workflow", description: "Review architecture options and decision evidence.", kind: "expanded" },
  { slug: "onboarding-accelerator", title: "Onboarding Accelerator", description: "Create role-based onboarding learning path.", kind: "expanded" },
  { slug: "prompt-safety-review", title: "Prompt Safety Review", description: "Inspect prompts for policy and safety risks.", kind: "expanded" },
  { slug: "evaluation-rubric-designer", title: "Evaluation Rubric Designer", description: "Define objective evaluation criteria and scoring.", kind: "expanded" },
  { slug: "workflow-optimization", title: "Workflow Optimization", description: "Identify bottlenecks and efficiency opportunities.", kind: "expanded" },
  { slug: "cross-team-handoff", title: "Cross Team Handoff", description: "Prepare clear handoff package with dependencies.", kind: "expanded" },
];
