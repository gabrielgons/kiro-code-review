---
name: "code-review"
displayName: "Code Review"
description: "Automated senior-level code review for Pull Requests. Analyzes code against OWASP, SOLID, KISS, DRY, Clean Code principles and project-specific guidelines. Generates detailed reports with severity classification and posts inline comments on GitHub."
keywords: ["code review", "pull request", "PR review", "OWASP", "clean code", "SOLID", "DRY", "KISS", "security", "best practices", "github review", "merge request"]
author: "Gabriel Gons"
---

# Code Review Power

## Overview

This power provides an automated, senior-level code review experience for Pull Requests. It analyzes code changes against industry-standard principles and project-specific guidelines, generating a comprehensive report classified by severity and optionally posting inline review comments directly on GitHub.

### Key Capabilities

- **PR Analysis**: Fetches and analyzes Pull Request diffs from GitHub
- **Project-Aware**: Detects project stack and respects project documentation (architecture docs, coding standards, etc.)
- **Multi-Principle Review**: Evaluates code against OWASP, SOLID, KISS, DRY, Clean Code, and more
- **Severity Classification**: Categorizes findings using a color-coded system (Green/Orange/Red)
- **Report Generation**: Creates detailed `.md` reports with code snippets and improvement suggestions
- **GitHub Integration**: Posts inline review comments on the exact lines with context and suggestions
- **Extensible Architecture**: Designed to support GitLab in the future

## Available Steering Files

- **review-principles.md** - Complete reference of all code review principles (OWASP, SOLID, KISS, DRY, Clean Code, performance, testing, etc.)
- **review-workflow.md** - Step-by-step workflow for conducting a code review, from PR fetch to comment posting
- **report-template.md** - Template and format specification for the generated review report

## Available MCP Server

### code-review-server

Tools provided:

| Tool | Description |
|------|-------------|
| `fetch_pull_request` | Fetches PR metadata, diff, and changed files from GitHub |
| `detect_project_stack` | Analyzes the repository to detect tech stack and frameworks |
| `find_project_guidelines` | Searches for project documentation (.md files with architecture, standards, conventions) |
| `generate_review_report` | Generates a severity-classified `.md` review report |
| `post_review_comments` | Posts inline review comments on GitHub PR at specific lines |

## Workflow

### 1. Receive PR URL

The user provides a GitHub PR URL like:
```
https://github.com/owner/repo/pull/123
```

### 2. Fetch PR Data

Use `fetch_pull_request` to retrieve:
- PR metadata (title, description, author, branch)
- Full diff with file changes
- List of modified files

### 3. Analyze Project Context

Use `detect_project_stack` to identify:
- Programming languages
- Frameworks and libraries
- Build tools and package managers

Use `find_project_guidelines` to search for:
- Architecture documentation
- Coding standards
- Development guidelines
- Any `.md` files that define project conventions

**Priority**: If project guidelines exist, they take precedence over general best practices.

### 4. Perform Code Review

Analyze each changed file against the principles defined in `steering/review-principles.md`:

- **Security (OWASP)**: Injection, auth, data exposure, XSS, etc.
- **Architecture (SOLID)**: Single responsibility, open/closed, etc.
- **Simplicity (KISS)**: Unnecessary complexity, over-engineering
- **Reusability (DRY)**: Code duplication, missed abstractions
- **Readability (Clean Code)**: Naming, functions, comments, formatting
- **Performance**: N+1 queries, memory leaks, unnecessary computation
- **Error Handling**: Missing try/catch, unhandled promises, error propagation
- **Testing**: Missing tests for critical paths, untestable code
- **Project Standards**: Compliance with project-specific guidelines

### 5. Generate Report

Use `generate_review_report` to create a `.md` file with:
- PR overview (title, author, files changed)
- Summary of findings by severity
- Detailed findings with code snippets, explanations, and suggestions
- Severity legend with colors

### 6. Present Overview

Show the user a summary of the review:
- Total findings count by severity
- Critical issues that need immediate attention
- Overall code quality assessment

### 7. Ask About GitHub Comments

After presenting the overview, ask the user:
> "Would you like me to post these review comments directly on the GitHub PR?"

If yes, use `post_review_comments` to create inline comments on the exact lines with:
- Severity indicator
- Problem description
- Suggestion for improvement
- Code example when applicable

## Severity Classification

| Color | Level | Description | Action Required |
|-------|-------|-------------|-----------------|
| :green_circle: Green | Low | Suggestions, style improvements, minor optimizations | Optional improvement |
| :orange_circle: Orange | Medium | Potential issues, attention needed, possible bugs | Should be addressed |
| :red_circle: Red | High | Critical bugs, security vulnerabilities, blocking issues | Must be fixed before merge |

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | Yes | GitHub Personal Access Token with `repo` scope |

### Token Permissions

The GitHub token needs:
- `repo` - Full control of private repositories (for reading PRs and posting comments)
- Or `public_repo` - For public repositories only

## Best Practices

1. **Always check project guidelines first** - Project-specific standards override general principles
2. **Be constructive** - Every criticism should come with a suggestion
3. **Prioritize severity** - Focus on critical issues first
4. **Provide context** - Explain WHY something is a problem, not just WHAT
5. **Show examples** - Include corrected code snippets when possible
6. **Respect style** - Don't nitpick formatting if it follows project conventions
7. **Consider scope** - Review only what changed in the PR, not the entire codebase

## Troubleshooting

### Error: "Bad credentials"
- Verify your `GITHUB_TOKEN` is valid and not expired
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
