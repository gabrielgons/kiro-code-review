/**
 * Types for the Code Review Power MCP Server
 */

export type Platform = "github" | "gitlab";

export type Severity = "critical" | "medium" | "low";

export type FindingCategory =
  | "Security"
  | "Architecture"
  | "SOLID"
  | "KISS"
  | "DRY"
  | "Clean Code"
  | "Performance"
  | "Error Handling"
  | "Testing"
  | "API Design"
  | "Concurrency"
  | "Documentation"
  | "Git Hygiene"
  | "Project Standards";

export interface PRInfo {
  owner: string;
  repo: string;
  number: number;
  title: string;
  description: string;
  author: string;
  headBranch: string;
  baseBranch: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  files: PRFile[];
  platform: Platform;
}

export interface PRFile {
  filename: string;
  status: "added" | "modified" | "removed" | "renamed";
  additions: number;
  deletions: number;
  patch: string;
  contentsUrl?: string;
}

export interface ProjectStack {
  languages: string[];
  frameworks: string[];
  buildTools: string[];
  testFrameworks: string[];
  linters: string[];
  packageManager: string | null;
}

export interface ProjectGuideline {
  filename: string;
  path: string;
  content: string;
  type: "architecture" | "coding-standards" | "contributing" | "api" | "general";
}

export interface ReviewFinding {
  id: string;
  severity: Severity;
  category: FindingCategory;
  title: string;
  file: string;
  startLine: number;
  endLine: number;
  description: string;
  currentCode: string;
  suggestedCode?: string;
  explanation: string;
  principle: string;
}

export interface ReviewReport {
  prInfo: PRInfo;
  stack: ProjectStack;
  guidelines: ProjectGuideline[];
  findings: ReviewFinding[];
  positiveHighlights: string[];
  overallAssessment: string;
  recommendation: "approve" | "request_changes" | "discuss";
  generatedAt: string;
}

export interface ReviewComment {
  path: string;
  line: number;
  side: "LEFT" | "RIGHT";
  body: string;
}

export interface ParsedPRUrl {
  platform: Platform;
  owner: string;
  repo: string;
  number: number;
}
