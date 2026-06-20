export type SkillType = "triage" | "review" | "docs" | "security" | "style" | "release" | "custom";

export interface LibrarySkill {
  name: string;
  slug: string;
  description: string;
  type: SkillType;
  content: string;
}

export const SUPERPOWER_SKILLS: LibrarySkill[] = [
  {
    name: "Superpowers (Core)",
    slug: "superpowers-core",
    description: "Core skills library with TDD, debugging, collaboration patterns, and proven techniques.",
    type: "custom",
    content: "Includes 20+ battle-tested skills for testing, debugging, and collaboration. Use these to brainstorm, write plans, and execute plans systematically."
  },
  {
    name: "Elements of Style",
    slug: "elements-of-style",
    description: "Writing guidance based on William Strunk Jr.'s The Elements of Style (1918).",
    type: "style",
    content: "All 18 rules for clear, concise writing. Grammar, punctuation, and composition guidance for generating documentation and code comments."
  },
  {
    name: "Developing for Claude Code",
    slug: "developing-for-claude-code",
    description: "Skills and resources for developing Claude Code plugins, skills, MCP servers, and extensions.",
    type: "docs",
    content: "Working with official documentation, developing plugins for streamlined workflows, and a self-update mechanism for references."
  },
  {
    name: "Private Journal MCP",
    slug: "private-journal-mcp",
    description: "Private journaling MCP server with semantic search via embeddings.",
    type: "custom",
    content: "Multi-section private journaling for project notes, technical insights, and user context. Features local AI semantic search via embeddings."
  },
  {
    name: "PR Security Auditor",
    slug: "pr-security-auditor",
    description: "Scans pull requests for hardcoded secrets, injection vulnerabilities, and other common security anti-patterns.",
    type: "security",
    content: "Automatically reviews changes for security anti-patterns. Blocks PRs that contain hardcoded keys or SQL injection risks."
  }
];
