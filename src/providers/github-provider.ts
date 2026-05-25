import { Octokit } from "@octokit/rest";
import {
  PRInfo,
  PRFile,
  ProjectGuideline,
  ReviewComment,
  ProjectStack,
} from "../types.js";
import { GitPlatformProvider } from "./base-provider.js";

/**
 * GitHub implementation of the Git platform provider.
 * Uses Octokit for GitHub API interactions.
 */
export class GitHubProvider implements GitPlatformProvider {
  readonly platform = "github" as const;
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  async fetchPullRequest(
    owner: string,
    repo: string,
    number: number
  ): Promise<PRInfo> {
    // Fetch PR metadata
    const { data: pr } = await this.octokit.pulls.get({
      owner,
      repo,
      pull_number: number,
    });

    // Fetch PR files with patches
    const files: PRFile[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const { data: pageFiles } = await this.octokit.pulls.listFiles({
        owner,
        repo,
        pull_number: number,
        per_page: 100,
        page,
      });

      for (const file of pageFiles) {
        files.push({
          filename: file.filename,
          status: file.status as PRFile["status"],
          additions: file.additions,
          deletions: file.deletions,
          patch: file.patch || "",
          contentsUrl: file.contents_url,
        });
      }

      hasMore = pageFiles.length === 100;
      page++;
    }

    return {
      owner,
      repo,
      number,
      title: pr.title,
      description: pr.body || "",
      author: pr.user?.login || "unknown",
      headBranch: pr.head.ref,
      baseBranch: pr.base.ref,
      additions: pr.additions,
      deletions: pr.deletions,
      changedFiles: pr.changed_files,
      files,
      platform: "github",
    };
  }

  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<string> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });

      if ("content" in data && data.content) {
        return Buffer.from(data.content, "base64").toString("utf-8");
      }

      throw new Error(`File ${path} has no content`);
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error(`File not found: ${path}`);
      }
      throw error;
    }
  }

  async listFiles(
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<string[]> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });

      if (Array.isArray(data)) {
        return data.map((item) => item.path);
      }

      return [path];
    } catch (error: any) {
      if (error.status === 404) {
        return [];
      }
      throw error;
    }
  }

  async findGuidelineFiles(
    owner: string,
    repo: string,
    ref?: string
  ): Promise<ProjectGuideline[]> {
    const guidelines: ProjectGuideline[] = [];

    // Priority list of guideline files to search
    const guidelinePatterns = [
      { path: "CONTRIBUTING.md", type: "contributing" as const },
      { path: "docs/architecture.md", type: "architecture" as const },
      { path: "docs/coding-standards.md", type: "coding-standards" as const },
      { path: "docs/development.md", type: "general" as const },
      { path: "docs/api-guidelines.md", type: "api" as const },
      { path: "STYLEGUIDE.md", type: "coding-standards" as const },
      { path: "docs/ARCHITECTURE.md", type: "architecture" as const },
      { path: "docs/CODING_STANDARDS.md", type: "coding-standards" as const },
      { path: "docs/standards.md", type: "coding-standards" as const },
      { path: ".github/CONTRIBUTING.md", type: "contributing" as const },
    ];

    // Check each known pattern
    for (const pattern of guidelinePatterns) {
      try {
        const content = await this.getFileContent(
          owner,
          repo,
          pattern.path,
          ref
        );
        guidelines.push({
          filename: pattern.path.split("/").pop() || pattern.path,
          path: pattern.path,
          content,
          type: pattern.type,
        });
      } catch {
        // File doesn't exist, skip
      }
    }

    // Also check docs/ directory for any .md files
    try {
      const docsFiles = await this.listFiles(owner, repo, "docs", ref);
      for (const file of docsFiles) {
        if (
          file.endsWith(".md") &&
          !guidelines.some((g) => g.path === file)
        ) {
          try {
            const content = await this.getFileContent(owner, repo, file, ref);
            guidelines.push({
              filename: file.split("/").pop() || file,
              path: file,
              content,
              type: "general",
            });
          } catch {
            // Skip unreadable files
          }
        }
      }
    } catch {
      // docs/ directory doesn't exist
    }

    return guidelines;
  }

  async detectStack(
    owner: string,
    repo: string,
    ref?: string
  ): Promise<ProjectStack> {
    const stack: ProjectStack = {
      languages: [],
      frameworks: [],
      buildTools: [],
      testFrameworks: [],
      linters: [],
      packageManager: null,
    };

    // Check for Node.js/JavaScript/TypeScript
    try {
      const packageJsonContent = await this.getFileContent(
        owner,
        repo,
        "package.json",
        ref
      );
      const packageJson = JSON.parse(packageJsonContent);

      stack.languages.push("TypeScript/JavaScript");

      // Detect package manager
      const lockFiles = await this.listFiles(owner, repo, "", ref);
      if (lockFiles.includes("pnpm-lock.yaml")) {
        stack.packageManager = "pnpm";
      } else if (lockFiles.includes("yarn.lock")) {
        stack.packageManager = "yarn";
      } else if (lockFiles.includes("bun.lockb")) {
        stack.packageManager = "bun";
      } else {
        stack.packageManager = "npm";
      }

      // Detect frameworks from dependencies
      const allDeps = {
        ...(packageJson.dependencies || {}),
        ...(packageJson.devDependencies || {}),
      };

      // Frontend frameworks
      if (allDeps["react"]) stack.frameworks.push("React");
      if (allDeps["next"]) stack.frameworks.push("Next.js");
      if (allDeps["vue"]) stack.frameworks.push("Vue.js");
      if (allDeps["nuxt"]) stack.frameworks.push("Nuxt");
      if (allDeps["@angular/core"]) stack.frameworks.push("Angular");
      if (allDeps["svelte"]) stack.frameworks.push("Svelte");

      // Backend frameworks
      if (allDeps["express"]) stack.frameworks.push("Express");
      if (allDeps["fastify"]) stack.frameworks.push("Fastify");
      if (allDeps["nestjs"] || allDeps["@nestjs/core"])
        stack.frameworks.push("NestJS");
      if (allDeps["hono"]) stack.frameworks.push("Hono");
      if (allDeps["koa"]) stack.frameworks.push("Koa");

      // Test frameworks
      if (allDeps["jest"]) stack.testFrameworks.push("Jest");
      if (allDeps["vitest"]) stack.testFrameworks.push("Vitest");
      if (allDeps["mocha"]) stack.testFrameworks.push("Mocha");
      if (allDeps["cypress"]) stack.testFrameworks.push("Cypress");
      if (allDeps["playwright"] || allDeps["@playwright/test"])
        stack.testFrameworks.push("Playwright");

      // Build tools
      if (allDeps["vite"]) stack.buildTools.push("Vite");
      if (allDeps["webpack"]) stack.buildTools.push("Webpack");
      if (allDeps["esbuild"]) stack.buildTools.push("esbuild");
      if (allDeps["tsup"]) stack.buildTools.push("tsup");
      if (allDeps["rollup"]) stack.buildTools.push("Rollup");
      if (allDeps["turbo"]) stack.buildTools.push("Turborepo");

      // Linters
      if (allDeps["eslint"]) stack.linters.push("ESLint");
      if (allDeps["prettier"]) stack.linters.push("Prettier");
      if (allDeps["biome"] || allDeps["@biomejs/biome"])
        stack.linters.push("Biome");
      if (allDeps["oxlint"]) stack.linters.push("oxlint");

      // TypeScript
      if (allDeps["typescript"]) {
        stack.languages = ["TypeScript"];
        stack.buildTools.push("tsc");
      }
    } catch {
      // Not a Node.js project
    }

    // Check for Python
    try {
      await this.getFileContent(owner, repo, "requirements.txt", ref);
      stack.languages.push("Python");
      stack.packageManager = stack.packageManager || "pip";
    } catch {
      try {
        const pyproject = await this.getFileContent(
          owner,
          repo,
          "pyproject.toml",
          ref
        );
        stack.languages.push("Python");
        if (pyproject.includes("[tool.poetry]")) {
          stack.packageManager = stack.packageManager || "poetry";
        } else {
          stack.packageManager = stack.packageManager || "pip";
        }
        if (pyproject.includes("django")) stack.frameworks.push("Django");
        if (pyproject.includes("fastapi")) stack.frameworks.push("FastAPI");
        if (pyproject.includes("flask")) stack.frameworks.push("Flask");
        if (pyproject.includes("pytest")) stack.testFrameworks.push("pytest");
      } catch {
        // Not a Python project
      }
    }

    // Check for Go
    try {
      await this.getFileContent(owner, repo, "go.mod", ref);
      stack.languages.push("Go");
      stack.packageManager = stack.packageManager || "go modules";
      stack.buildTools.push("go build");
    } catch {
      // Not a Go project
    }

    // Check for Java
    try {
      await this.getFileContent(owner, repo, "pom.xml", ref);
      stack.languages.push("Java");
      stack.buildTools.push("Maven");
      stack.packageManager = stack.packageManager || "maven";
    } catch {
      try {
        await this.getFileContent(owner, repo, "build.gradle", ref);
        stack.languages.push("Java/Kotlin");
        stack.buildTools.push("Gradle");
        stack.packageManager = stack.packageManager || "gradle";
      } catch {
        // Not a Java project
      }
    }

    // Check for Rust
    try {
      await this.getFileContent(owner, repo, "Cargo.toml", ref);
      stack.languages.push("Rust");
      stack.buildTools.push("cargo");
      stack.packageManager = stack.packageManager || "cargo";
    } catch {
      // Not a Rust project
    }

    // Check for Ruby
    try {
      await this.getFileContent(owner, repo, "Gemfile", ref);
      stack.languages.push("Ruby");
      stack.packageManager = stack.packageManager || "bundler";
    } catch {
      // Not a Ruby project
    }

    return stack;
  }

  async postReviewComments(
    owner: string,
    repo: string,
    number: number,
    comments: ReviewComment[],
    summary: string
  ): Promise<{ success: boolean; postedCount: number; errors: string[] }> {
    const errors: string[] = [];
    let postedCount = 0;

    try {
      // Get the latest commit SHA for the PR
      const { data: pr } = await this.octokit.pulls.get({
        owner,
        repo,
        pull_number: number,
      });

      const commitId = pr.head.sha;

      // Create a review with all inline comments
      const reviewComments = comments.map((comment) => ({
        path: comment.path,
        line: comment.line,
        side: comment.side,
        body: comment.body,
      }));

      // Submit as a single review
      await this.octokit.pulls.createReview({
        owner,
        repo,
        pull_number: number,
        commit_id: commitId,
        body: summary,
        event: "COMMENT",
        comments: reviewComments,
      });

      postedCount = comments.length;
    } catch (error: any) {
      // If bulk review fails, try posting comments individually
      if (error.status === 422) {
        for (const comment of comments) {
          try {
            const { data: pr } = await this.octokit.pulls.get({
              owner,
              repo,
              pull_number: number,
            });

            await this.octokit.pulls.createReviewComment({
              owner,
              repo,
              pull_number: number,
              commit_id: pr.head.sha,
              path: comment.path,
              line: comment.line,
              side: comment.side,
              body: comment.body,
            });
            postedCount++;
          } catch (commentError: any) {
            errors.push(
              `Failed to post comment on ${comment.path}:${comment.line} - ${commentError.message}`
            );
          }
        }

        // Post summary as a regular comment if it wasn't posted
        if (summary) {
          try {
            await this.octokit.issues.createComment({
              owner,
              repo,
              issue_number: number,
              body: summary,
            });
          } catch (summaryError: any) {
            errors.push(`Failed to post summary: ${summaryError.message}`);
          }
        }
      } else {
        errors.push(`Review submission failed: ${error.message}`);
      }
    }

    return {
      success: errors.length === 0,
      postedCount,
      errors,
    };
  }
}
