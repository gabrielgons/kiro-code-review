---
name: "code-review"
displayName: "Code Review"
description: "Automated senior-level code review for Pull Requests. Analyzes code against OWASP, SOLID, KISS, DRY, Clean Code principles and project-specific guidelines with stack-aware best practices. Pragmatic by design — no nitpicking."
keywords: ["code review", "pull request", "PR review", "review PR", "OWASP", "clean code", "SOLID", "DRY", "KISS", "security", "best practices", "github review", "merge request", "review this", "analyze PR", "github.com/pull"]
author: "Gabriel Gons"
---

# Code Review Power

## Overview

This power provides an automated, senior-level code review experience for Pull Requests. It analyzes code changes against industry-standard principles and project-specific guidelines, generating a comprehensive report classified by severity and optionally posting inline review comments directly on GitHub.

**This is a Knowledge Base Power** that uses the official GitHub MCP server (`@modelcontextprotocol/server-github`) for all GitHub API interactions. No custom server code — just pure review intelligence via steering files.

### Key Capabilities

- **PR Analysis**: Fetches and analyzes Pull Request diffs from GitHub via official MCP tools
- **Project-Aware**: Detects project stack and respects project documentation (architecture docs, coding standards, etc.)
- **Multi-Principle Review**: Evaluates code against OWASP, SOLID, KISS, DRY, Clean Code, and more
- **Severity Classification**: Categorizes findings using a color-coded system (Green/Orange/Red)
- **Report Generation**: Creates detailed `.md` reports with code snippets and improvement suggestions
- **GitHub Integration**: Posts inline review comments on the exact lines with context and suggestions
- **Extensible Architecture**: Designed to support GitLab in the future

## Available Steering Files

- **review-principles.md** - Complete reference of all code review principles (Pragmatism, OWASP, SOLID, KISS, DRY, Clean Code, Architecture, Stack-Specific, etc.)
- **review-workflow.md** - Step-by-step workflow for conducting a code review, from PR fetch to comment posting
- **report-template.md** - Template and format specification for the generated review report

## MCP Server: GitHub (Official)

This power uses the official `@modelcontextprotocol/server-github` maintained by the MCP team. The relevant tools for code review are:

| Tool | Description |
|------|-------------|
| `get_pull_request` | Get details of a specific pull request (title, description, author, branches) |
| `get_pull_request_files` | Get the list of files changed in a pull request (with patches/diffs) |
| `get_pull_request_comments` | Get the review comments on a pull request |
| `get_pull_request_reviews` | Get the reviews on a pull request |
| `get_file_contents` | Get the contents of a file or directory from a repository |
| `search_code` | Search for code across GitHub repositories |
| `create_pull_request_review` | Create a review on a pull request with inline comments |

## Workflow

### Activation

This power activates when:
- The user mentions "code review", "review PR", "review this PR", "analyze PR"
- The user pastes a GitHub PR URL (e.g., `https://github.com/owner/repo/pull/123`)
- The user asks to review, analyze, or check a Pull Request

**When a PR URL is detected, immediately begin the review workflow without requiring additional confirmation.**

### 1. Receive PR URL

The user provides a GitHub PR URL like:
```
https://github.com/owner/repo/pull/123
```

Parse it to extract: `owner`, `repo`, `pull_number`.

### 2. Fetch PR Data

Use the official GitHub MCP tools:

```
get_pull_request(owner, repo, pull_number)
```
→ Returns: title, description, author, head/base branches, additions/deletions count

```
get_pull_request_files(owner, repo, pull_number)
```
→ Returns: list of changed files with status, additions, deletions, and patch (unified diff)

### 3. Analyze Project Context

Use `get_file_contents` to detect the project stack by checking for:
- `package.json` → Node.js/TypeScript (check dependencies for React, Vue, Next.js, NestJS, etc.)
- `requirements.txt` / `pyproject.toml` → Python (Django, FastAPI, Flask)
- `go.mod` → Go
- `pom.xml` / `build.gradle` → Java/Kotlin (Spring Boot)
- `Cargo.toml` → Rust
- `Gemfile` → Ruby (Rails)
- `.csproj` → .NET/C#

Then search for project guidelines:
```
get_file_contents(owner, repo, "CONTRIBUTING.md")
get_file_contents(owner, repo, "docs/architecture.md")
get_file_contents(owner, repo, "docs/coding-standards.md")
```

Also check for linter/formatter configs (`.eslintrc`, `.prettierrc`, `biome.json`, `tsconfig.json`) as implicit standards.

**Priority**: If project guidelines exist, they take **absolute precedence** over general best practices.

### 4. Perform Code Review

Analyze each changed file against the principles defined in `steering/review-principles.md`:

- **Pragmatism (Section 0)**: Filter out nitpicks, personal preferences, and style issues handled by linters
- **Security (OWASP)**: Injection, auth, data exposure, XSS, etc.
- **Architecture (Section 11)**: Cohesion, coupling, separation, adherence to project patterns, over-engineering
- **SOLID**: Single responsibility, open/closed, etc.
- **KISS**: Unnecessary complexity, over-engineering
- **DRY**: Code duplication, missed abstractions
- **Clean Code**: Naming, functions, comments, formatting
- **Performance**: N+1 queries, memory leaks, unnecessary computation
- **Error Handling**: Missing try/catch, unhandled promises, error propagation
- **Testing**: Missing tests for critical paths, untestable code
- **Stack-Specific (Section 14)**: Apply best practices specific to the detected stack
- **Project Standards**: Compliance with project-specific guidelines

### 5. Generate Report

Generate a `.md` report following the template in `steering/report-template.md`:
- PR overview (title, author, files changed)
- Summary of findings by severity
- Detailed findings with code snippets, explanations, and suggestions
- Severity legend with colors
- Positive highlights
- Recommendation (approve / request changes / discuss)

### 6. Present Overview

Show the user a concise summary:
- Total findings count by severity
- Critical issues that need immediate attention
- Overall code quality assessment
- Top 2-3 most important findings

### 7. Ask About GitHub Comments

After presenting the overview, ask the user:
> "Would you like me to post these review comments directly on the GitHub PR? I can post:
> - All findings (X comments)
> - Only critical and medium issues (X comments)
> - Only critical issues (X comments)"

If yes, use:
```
create_pull_request_review(owner, repo, pull_number, body, event, comments)
```

Where `comments` is an array of inline comments with:
- `path`: file path
- `line`: line number in the diff
- `body`: formatted comment with severity emoji, description, and suggestion

**Always use `event: "COMMENT"` (not APPROVE or REQUEST_CHANGES)** — the power provides information, never blocks.

## Severity Classification

| Color | Level | Description | Action Required |
|-------|-------|-------------|-----------------|
| 🟢 Green | Low | Suggestions, style improvements, minor optimizations | Optional improvement |
| 🟠 Orange | Medium | Potential issues, attention needed, possible bugs | Should be addressed |
| 🔴 Red | High | Critical bugs, security vulnerabilities, blocking issues | Must be fixed before merge |

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_PERSONAL_ACCESS_TOKEN` | Yes | GitHub Personal Access Token with `repo` scope |

### Token Permissions

The GitHub token needs:
- `repo` - Full control of private repositories (for reading PRs and posting comments)
- Or `public_repo` - For public repositories only

## Best Practices

### Pragmatism First

The most important rule: **DO NOT NITPICK.** Every comment must be classified as:

| Level | When to Post | Example |
|-------|-------------|---------|
| 🚨 Critical | Always | SQL injection, null pointer in prod path |
| ⚠️ Recommended | Always | Missing error handling, high coupling |
| 💡 Suggestion | Max 5-7 per PR | Better naming, extract method |
| 🤷 Personal preference | **NEVER POST** | "I'd use a ternary here" |

**Rules:**
- If a linter/formatter handles it, don't comment on it
- If the code works and the approach is valid, don't suggest your personal alternative
- If it's pre-existing code not changed in this PR, don't flag it
- Always ask: "Does this actually cause a real-world problem?"

### Stack-Aware Review

This power does NOT do generic reviews. It applies **specific best practices for the detected stack**:

- **Java/Spring**: Transaction scope, DI patterns, entity exposure, JPA pitfalls
- **.NET/C#**: async/await correctness, DI lifetime, EF tracking, null safety
- **Node.js/TS**: Event loop blocking, floating promises, TypeScript strictness
- **React**: Render performance, hook rules, composition patterns, a11y
- **Vue**: Composition API patterns, reactivity gotchas, computed caching
- **Python/Django/FastAPI**: N+1 queries, type hints, Pydantic models, async patterns
- **Go**: Error wrapping, goroutine lifecycle, interface placement, context propagation
- **PostgreSQL**: Index awareness, migration safety, isolation levels
- **Kubernetes**: Resource limits, probes, image pinning, network policies
- **AWS**: IAM least privilege, VPC rules, managed service usage

A review that only checks "naming" and "DRY" without stack-specific knowledge is **superficial and incomplete**.

### Additional Principles

1. **Always check project guidelines first** - Project-specific standards override general principles
2. **Be constructive** - Every criticism should come with a suggestion
3. **Prioritize severity** - Focus on critical issues first
4. **Provide context** - Explain WHY something is a problem, not just WHAT
5. **Show examples** - Include corrected code snippets when possible
6. **Respect style** - Don't nitpick formatting if it follows project conventions
7. **Consider scope** - Review only what changed in the PR, not the entire codebase
8. **Recognize good work** - Include positive highlights in the report

## Troubleshooting

### Error: "Bad credentials"
- Verify your `GITHUB_PERSONAL_ACCESS_TOKEN` is valid and not expired
- Ensure the token has the required scopes

### Error: "Not Found" when fetching PR
- Check the PR URL format: `https://github.com/owner/repo/pull/number`
- Verify you have access to the repository

### Error: "Validation Failed" when posting comments
- The comment line must be within the diff range
- Ensure the file path matches exactly what's in the PR diff

### No project guidelines found
- The power will fall back to general best practices based on detected stack
- Consider creating a `CONTRIBUTING.md` or `docs/architecture.md` in your project
