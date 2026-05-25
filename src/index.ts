#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { parsePRUrl } from "./utils/url-parser.js";
import { GitHubProvider } from "./providers/github-provider.js";
import { GitPlatformProvider } from "./providers/base-provider.js";
import { ReviewFinding, ReviewComment, Severity } from "./types.js";

// Initialize MCP Server
const server = new McpServer({
  name: "code-review-server",
  version: "1.0.0",
});

/**
 * Get the appropriate provider based on platform
 */
function getProvider(platform: string): GitPlatformProvider {
  const token = process.env.GITHUB_TOKEN;

  if (platform === "github") {
    if (!token) {
      throw new Error(
        "GITHUB_TOKEN environment variable is required. " +
          "Set it with a Personal Access Token that has 'repo' scope."
      );
    }
    return new GitHubProvider(token);
  }

  if (platform === "gitlab") {
    throw new Error(
      "GitLab support is planned but not yet implemented. " +
        "Currently only GitHub is supported."
    );
  }

  throw new Error(`Unsupported platform: ${platform}`);
}

// ============================================================================
// Tool: fetch_pull_request
// ============================================================================
server.tool(
  "fetch_pull_request",
  "Fetches Pull Request metadata, diff, and changed files from GitHub. Provide the full PR URL.",
  {
    url: z
      .string()
      .url()
      .describe(
        "Full PR URL (e.g., https://github.com/owner/repo/pull/123)"
      ),
  },
  async ({ url }) => {
    try {
      const parsed = parsePRUrl(url);
      const provider = getProvider(parsed.platform);
      const prInfo = await provider.fetchPullRequest(
        parsed.owner,
        parsed.repo,
        parsed.number
      );

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(prInfo, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error fetching PR: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// ============================================================================
// Tool: detect_project_stack
// ============================================================================
server.tool(
  "detect_project_stack",
  "Analyzes a repository to detect the technology stack including languages, frameworks, build tools, test frameworks, and linters.",
  {
    owner: z.string().describe("Repository owner (user or organization)"),
    repo: z.string().describe("Repository name"),
    ref: z
      .string()
      .optional()
      .describe("Git ref (branch/tag/SHA) to analyze. Defaults to main branch."),
  },
  async ({ owner, repo, ref }) => {
    try {
      const provider = getProvider("github");
      const stack = await provider.detectStack(owner, repo, ref);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(stack, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error detecting stack: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// ============================================================================
// Tool: find_project_guidelines
// ============================================================================
server.tool(
  "find_project_guidelines",
  "Searches the repository for documentation files that define architecture, coding standards, contribution guidelines, and other project conventions. These take priority over general best practices during review.",
  {
    owner: z.string().describe("Repository owner (user or organization)"),
    repo: z.string().describe("Repository name"),
    ref: z
      .string()
      .optional()
      .describe("Git ref (branch/tag/SHA) to search. Defaults to main branch."),
  },
  async ({ owner, repo, ref }) => {
    try {
      const provider = getProvider("github");
      const guidelines = await provider.findGuidelineFiles(owner, repo, ref);

      if (guidelines.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  found: false,
                  message:
                    "No project-specific guidelines found. Review will be based on general best practices and detected stack conventions.",
                  guidelines: [],
                },
                null,
                2
              ),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                found: true,
                message: `Found ${guidelines.length} guideline file(s). These will take priority during review.`,
                guidelines: guidelines.map((g) => ({
                  filename: g.filename,
                  path: g.path,
                  type: g.type,
                  contentPreview:
                    g.content.substring(0, 500) +
                    (g.content.length > 500 ? "..." : ""),
                  fullContent: g.content,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error finding guidelines: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// ============================================================================
// Tool: generate_review_report
// ============================================================================
server.tool(
  "generate_review_report",
  "Generates a severity-classified Markdown review report from the analysis findings. Returns the formatted report content ready to be saved as a .md file.",
  {
    pr_url: z.string().url().describe("The PR URL that was reviewed"),
    pr_title: z.string().describe("PR title"),
    pr_author: z.string().describe("PR author username"),
    head_branch: z.string().describe("Source branch name"),
    base_branch: z.string().describe("Target branch name"),
    files_changed: z.number().describe("Number of files changed"),
    additions: z.number().describe("Total lines added"),
    deletions: z.number().describe("Total lines deleted"),
    languages: z.array(z.string()).describe("Detected languages"),
    frameworks: z.array(z.string()).describe("Detected frameworks"),
    guidelines_found: z
      .array(z.string())
      .describe("List of guideline file names found"),
    findings: z
      .array(
        z.object({
          id: z.string(),
          severity: z.enum(["critical", "medium", "low"]),
          category: z.string(),
          title: z.string(),
          file: z.string(),
          startLine: z.number(),
          endLine: z.number(),
          description: z.string(),
          currentCode: z.string(),
          suggestedCode: z.string().optional(),
          explanation: z.string(),
          principle: z.string(),
        })
      )
      .describe("Array of review findings"),
    positive_highlights: z
      .array(z.string())
      .describe("Positive aspects observed in the code"),
    overall_assessment: z
      .string()
      .describe("Overall quality assessment paragraph"),
    recommendation: z
      .enum(["approve", "request_changes", "discuss"])
      .describe("Review recommendation"),
  },
  async ({
    pr_url,
    pr_title,
    pr_author,
    head_branch,
    base_branch,
    files_changed,
    additions,
    deletions,
    languages,
    frameworks,
    guidelines_found,
    findings,
    positive_highlights,
    overall_assessment,
    recommendation,
  }) => {
    const now = new Date().toISOString().split("T")[0];

    const criticalFindings = findings.filter((f) => f.severity === "critical");
    const mediumFindings = findings.filter((f) => f.severity === "medium");
    const lowFindings = findings.filter((f) => f.severity === "low");

    // Build the report
    let report = `# Code Review Report

> Generated by [Code Review Power](https://github.com/gabrielgons/kiro-code-review)
> Date: ${now}

---

## PR Information

| Field | Value |
|-------|-------|
| **PR** | [${pr_title}](${pr_url}) |
| **Author** | @${pr_author} |
| **Branch** | \`${head_branch}\` -> \`${base_branch}\` |
| **Files Changed** | ${files_changed} |
| **Lines** | +${additions} / -${deletions} |

---

## Project Context

### Detected Stack
- **Language(s)**: ${languages.join(", ") || "Not detected"}
- **Framework(s)**: ${frameworks.join(", ") || "None detected"}

### Project Guidelines
${
  guidelines_found.length > 0
    ? guidelines_found.map((g) => `- \`${g}\``).join("\n")
    : "No project-specific guidelines detected. Review based on general best practices."
}

---

## Executive Summary

| Severity | Count |
|----------|-------|
| :red_circle: Critical | ${criticalFindings.length} |
| :orange_circle: Medium | ${mediumFindings.length} |
| :green_circle: Suggestion | ${lowFindings.length} |
| **Total** | **${findings.length}** |

### Overall Assessment

${overall_assessment}

### Recommendation: **${recommendation === "approve" ? "Approve" : recommendation === "request_changes" ? "Request Changes" : "Needs Discussion"}**

---

## Detailed Findings

`;

    // Critical findings
    report += `### :red_circle: Critical Issues\n\n`;
    if (criticalFindings.length === 0) {
      report += `No critical issues found.\n\n`;
    } else {
      for (const finding of criticalFindings) {
        report += formatFinding(finding);
      }
    }

    // Medium findings
    report += `### :orange_circle: Medium Issues\n\n`;
    if (mediumFindings.length === 0) {
      report += `No medium issues found.\n\n`;
    } else {
      for (const finding of mediumFindings) {
        report += formatFinding(finding);
      }
    }

    // Low findings
    report += `### :green_circle: Suggestions\n\n`;
    if (lowFindings.length === 0) {
      report += `No additional suggestions.\n\n`;
    } else {
      for (const finding of lowFindings) {
        report += formatFinding(finding);
      }
    }

    // Positive highlights
    report += `---\n\n## Positive Highlights\n\n`;
    for (const highlight of positive_highlights) {
      report += `- ${highlight}\n`;
    }

    // Review checklist
    report += `\n---\n\n## Review Checklist\n\n`;
    report += `- [x] Security (OWASP Top 10)\n`;
    report += `- [x] SOLID Principles\n`;
    report += `- [x] KISS (Keep It Simple)\n`;
    report += `- [x] DRY (Don't Repeat Yourself)\n`;
    report += `- [x] Clean Code (Naming, Functions, Comments)\n`;
    report += `- [x] Performance\n`;
    report += `- [x] Error Handling & Resilience\n`;
    report += `- [x] Testing Considerations\n`;
    report += `- [x] Architecture & Design Patterns\n`;
    report += `- [x] Documentation & Maintainability\n`;
    report += `- [x] Git & PR Hygiene\n`;
    report += `- [x] Project-Specific Standards ${guidelines_found.length > 0 ? "(applied)" : "(not found)"}\n`;

    report += `\n---\n\n*Report generated by Code Review Power v1.0*\n`;

    return {
      content: [
        {
          type: "text" as const,
          text: report,
        },
      ],
    };
  }
);

// ============================================================================
// Tool: post_review_comments
// ============================================================================
server.tool(
  "post_review_comments",
  "Posts inline review comments on a GitHub Pull Request. Comments are posted on specific lines with severity indicators and suggestions. Optionally filters by severity level.",
  {
    url: z
      .string()
      .url()
      .describe("Full PR URL (e.g., https://github.com/owner/repo/pull/123)"),
    comments: z
      .array(
        z.object({
          path: z.string().describe("File path relative to repo root"),
          line: z.number().describe("Line number in the diff to comment on"),
          side: z
            .enum(["LEFT", "RIGHT"])
            .default("RIGHT")
            .describe("Side of the diff (RIGHT for additions, LEFT for deletions)"),
          severity: z
            .enum(["critical", "medium", "low"])
            .describe("Severity level of the finding"),
          category: z.string().describe("Category (Security, SOLID, etc.)"),
          title: z.string().describe("Brief title of the finding"),
          body: z
            .string()
            .describe("Full comment body with description and suggestion"),
        })
      )
      .describe("Array of comments to post"),
    summary: z
      .string()
      .describe(
        "Summary comment to post at the PR level with overall review results"
      ),
  },
  async ({ url, comments, summary }) => {
    try {
      const parsed = parsePRUrl(url);
      const provider = getProvider(parsed.platform);

      // Format comments with severity emojis
      const formattedComments: ReviewComment[] = comments.map((c) => {
        const emoji =
          c.severity === "critical"
            ? ":red_circle:"
            : c.severity === "medium"
              ? ":orange_circle:"
              : ":green_circle:";

        return {
          path: c.path,
          line: c.line,
          side: c.side,
          body: `${emoji} **[${c.category}]** ${c.title}\n\n${c.body}`,
        };
      });

      const result = await provider.postReviewComments(
        parsed.owner,
        parsed.repo,
        parsed.number,
        formattedComments,
        summary
      );

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: result.success,
                postedCount: result.postedCount,
                totalComments: comments.length,
                errors: result.errors,
                message: result.success
                  ? `Successfully posted ${result.postedCount} review comments on the PR.`
                  : `Posted ${result.postedCount}/${comments.length} comments. Some failed: ${result.errors.join("; ")}`,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error posting comments: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// ============================================================================
// Helper Functions
// ============================================================================

function formatFinding(finding: any): string {
  const lang = detectLanguageFromFile(finding.file);

  let section = `#### ${finding.id}: [${finding.category}] ${finding.title}\n\n`;
  section += `| Field | Value |\n|-------|-------|\n`;
  section += `| **File** | \`${finding.file}\` |\n`;
  section += `| **Line(s)** | L${finding.startLine}${finding.endLine !== finding.startLine ? `-L${finding.endLine}` : ""} |\n`;
  section += `| **Principle** | ${finding.principle} |\n\n`;
  section += `**Problem:**\n\n${finding.description}\n\n`;

  if (finding.currentCode) {
    section += `**Current Code:**\n\n\`\`\`${lang}\n${finding.currentCode}\n\`\`\`\n\n`;
  }

  if (finding.suggestedCode) {
    section += `**Suggested Fix:**\n\n\`\`\`${lang}\n${finding.suggestedCode}\n\`\`\`\n\n`;
  }

  section += `**Why this matters:**\n\n> ${finding.explanation}\n\n---\n\n`;

  return section;
}

function detectLanguageFromFile(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const langMap: Record<string, string> = {
    ts: "typescript",
    tsx: "tsx",
    js: "javascript",
    jsx: "jsx",
    py: "python",
    go: "go",
    rs: "rust",
    java: "java",
    kt: "kotlin",
    rb: "ruby",
    php: "php",
    cs: "csharp",
    cpp: "cpp",
    c: "c",
    swift: "swift",
    dart: "dart",
    yml: "yaml",
    yaml: "yaml",
    json: "json",
    md: "markdown",
    sql: "sql",
    sh: "bash",
    bash: "bash",
    zsh: "bash",
    dockerfile: "dockerfile",
    tf: "hcl",
  };
  return langMap[ext] || ext;
}

// ============================================================================
// Start Server
// ============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Code Review MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
