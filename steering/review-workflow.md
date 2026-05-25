# Code Review Workflow

## Overview

This steering file defines the step-by-step workflow for conducting a complete code review using this power. Follow these steps in order for every review.

**This power uses the official GitHub MCP server tools.** All GitHub interactions are done via `@modelcontextprotocol/server-github`.

---

## Step 1: Parse PR URL

Extract the owner, repository, and PR number from the provided URL.

**Supported formats:**
```
https://github.com/{owner}/{repo}/pull/{number}
https://github.com/{owner}/{repo}/pull/{number}/files
https://github.com/{owner}/{repo}/pull/{number}/commits
```

**Validation:**
- URL must be a valid GitHub PR URL
- Extract: `owner`, `repo`, `pull_number`
- If invalid, ask the user to provide a correct URL

---

## Step 2: Fetch PR Data

Use the official GitHub MCP tools:

### 2.1 Get PR metadata
```
Tool: get_pull_request
Params: owner, repo, pull_number
```
Returns: title, body (description), user (author), head/base refs, additions, deletions, changed_files count, state, mergeable status.

### 2.2 Get changed files with diffs
```
Tool: get_pull_request_files
Params: owner, repo, pull_number
```
Returns: array of files with `filename`, `status` (added/modified/removed/renamed), `additions`, `deletions`, `patch` (unified diff).

**Error handling:**
- If 404: Repository or PR not found - verify access
- If 401: Token invalid or missing permissions
- If rate limited: Inform user and suggest waiting

---

## Step 3: Detect Project Stack

Use `get_file_contents` to check for stack-indicator files in the repository root:

### Detection strategy:

```
Tool: get_file_contents
Params: owner, repo, path="package.json"
```

1. **package.json** → Node.js/JS/TS — parse dependencies for:
   - React, Next.js, Vue, Nuxt, Angular, Svelte (frontend)
   - Express, Fastify, NestJS, Hono, Koa (backend)
   - Jest, Vitest, Mocha, Playwright (testing)
   - ESLint, Prettier, Biome (linting)
   - Vite, Webpack, tsup (bundling)

2. **requirements.txt** / **pyproject.toml** → Python — check for Django, FastAPI, Flask, pytest

3. **go.mod** → Go

4. **pom.xml** / **build.gradle** → Java/Kotlin — check for Spring Boot

5. **Cargo.toml** → Rust

6. **Gemfile** → Ruby — check for Rails

7. **.csproj** / **\*.sln** → .NET/C#

8. Check file extensions in the PR changed files for additional signals

**Output:**
- Primary language(s)
- Framework(s) detected
- Test framework (if detectable)
- Linter/formatter (if configured)
- Package manager

---

## Step 4: Find Project Guidelines

Use `get_file_contents` to search for documentation files.

**Files to search for (priority order):**

```
Tool: get_file_contents
Params: owner, repo, path="CONTRIBUTING.md"
```

1. `CONTRIBUTING.md` - Contribution guidelines
2. `docs/architecture.md` - Architecture documentation
3. `docs/coding-standards.md` - Coding standards
4. `.github/PULL_REQUEST_TEMPLATE.md` - PR template
5. `docs/development.md` - Development guidelines
6. `STYLEGUIDE.md` - Style guide
7. `docs/api-guidelines.md` - API design guidelines
8. Any `.md` file in `docs/` directory with relevant keywords
9. `.eslintrc.*` / `.prettierrc.*` / `biome.json` / `tsconfig.json` - Tool configurations as implicit standards
10. `ADR/` or `docs/adr/` directory - Architecture Decision Records

**To list directories:**
```
Tool: get_file_contents
Params: owner, repo, path="docs"
```
(Returns directory listing when path is a directory)

**Important:** If project guidelines are found, they take **absolute priority** over general principles. The review should be conducted primarily through the lens of the project's own standards.

---

## Step 5: Analyze Code Changes

For each changed file, perform analysis against the principles in `review-principles.md`.

**Analysis order (by priority):**

1. **Security issues** (Red severity by default)
   - OWASP Top 10 violations
   - Hardcoded secrets
   - Missing input validation

2. **Critical bugs** (Red severity)
   - Logic errors
   - Null pointer risks
   - Race conditions
   - Resource leaks

3. **Architecture violations** (Orange/Red depending on impact)
   - SOLID violations
   - Breaking established patterns
   - Introducing tight coupling
   - Not following project architecture

4. **Code quality** (Orange severity)
   - DRY violations
   - KISS violations
   - Error handling gaps
   - Missing validation

5. **Stack-specific issues** (Orange/Red depending on severity)
   - Apply Section 14 from review-principles.md
   - Must use best practices for the specific detected stack

6. **Maintainability** (Green/Orange severity)
   - Clean Code violations
   - Naming issues
   - Documentation gaps
   - Test coverage concerns

7. **Suggestions** (Green severity)
   - Performance optimizations
   - Better patterns/approaches
   - Modern language features
   - Max 5-7 per PR

**For each finding, capture:**
- File path
- Line number(s) - must be within the diff
- Severity (green/orange/red)
- Category (Security, Architecture, Quality, etc.)
- Description of the issue
- Explanation of WHY it's a problem (real-world impact)
- Suggested fix with code example (when applicable)

**PRAGMATISM CHECK (apply to every finding before including it):**
- Does this actually cause a real-world problem? If not → discard
- Is this a personal preference? If yes → discard
- Is this handled by a linter? If yes → discard
- Is this outside the PR scope? If yes → discard

---

## Step 6: Generate Report

Generate a Markdown report following the template in `steering/report-template.md`.

**Report structure:**
- PR Information table
- Project context (stack, guidelines found)
- Executive Summary (count by severity + overall assessment)
- Detailed Findings (grouped by severity: Red → Orange → Green)
- Files Reviewed table
- Review Checklist
- Positive Highlights
- Recommendations (before merge / should address / consider for future)

---

## Step 7: Present Overview to User

After generating the report, present a concise overview:

```
## Review Complete!

**PR**: {title} by @{author}
**Files analyzed**: {count}
**Stack**: {detected_stack}

### Findings Summary:
- 🔴 {X} critical issues requiring immediate attention
- 🟠 {X} medium issues that should be addressed
- 🟢 {X} suggestions for improvement

### Top Issues:
1. {Brief description of most critical finding}
2. {Brief description of second most critical finding}
3. {Brief description of third finding}

### Overall Assessment:
{1-2 sentences on code quality and recommendation}

The full report is below / has been saved.
```

---

## Step 8: Offer GitHub Comments

Ask the user:

> "Would you like me to post these review comments as inline comments on the GitHub PR? I can post:
> - All findings ({X} comments)
> - Only critical and medium issues ({X} comments)
> - Only critical issues ({X} comments)
>
> Or would you prefer to review the report first and select specific comments to post?"

**If user agrees:**

Use the official GitHub MCP tool:

```
Tool: create_pull_request_review
Params:
  owner: "{owner}"
  repo: "{repo}"
  pull_number: {number}
  body: "{summary_comment}"
  event: "COMMENT"
  comments: [
    {
      "path": "src/example.ts",
      "line": 42,
      "body": "🔴 **[Security]** SQL Injection Risk\n\n..."
    },
    ...
  ]
```

### Comment format for each inline comment:

**For Critical Issues:**
```markdown
🔴 **[{Category}]** {Title}

{Problem description - 2-3 sentences max}

**Suggested fix:**
```{language}
{code_suggestion}
```

> ⚠️ **Impact:** {Brief impact statement}
```

**For Medium Issues:**
```markdown
🟠 **[{Category}]** {Title}

{Problem description - 2-3 sentences max}

**Consider:**
```{language}
{code_suggestion}
```
```

**For Suggestions:**
```markdown
🟢 **[{Category}]** {Title}

{Suggestion - 1-2 sentences}

```{language}
{example_code}
```
```

### PR-Level Summary Comment (the `body` parameter):

```markdown
## 🔍 Code Review Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | {count} |
| 🟠 Medium | {count} |
| 🟢 Suggestion | {count} |

### Key Observations

{2-3 bullet points with the most important findings}

### Recommendation

{approve / request changes / needs discussion}

---
*Automated review by [Code Review Power](https://github.com/gabrielgons/kiro-code-review)*
```

**Important considerations for posting:**
- Comments must reference lines that exist in the diff (not arbitrary lines)
- Use `event: "COMMENT"` — never `APPROVE` or `REQUEST_CHANGES` (the power informs, never blocks)
- Group all comments into a single review submission
- If a comment targets a deleted line, use the appropriate diff position

---

## Error Handling Throughout Workflow

| Error | Action |
|-------|--------|
| Invalid PR URL | Ask user for correct URL format |
| Repository not accessible | Check token permissions, inform user |
| Empty diff | Inform user the PR has no code changes |
| Rate limit reached | Inform user, suggest waiting |
| Comment posting fails | Save comments locally, report which failed |
| Large PR (>50 files) | Warn user, suggest reviewing in batches or focusing on critical files |
| File not found (guidelines) | Skip silently, fall back to general best practices |

---

## GitLab Support (Future)

The workflow is designed to be extensible for GitLab:

**Differences to implement:**
- URL format: `https://gitlab.com/{group}/{project}/-/merge_requests/{number}`
- API: GitLab Merge Request API (different MCP server needed)
- Comment format: GitLab Discussion/Note API
- Authentication: GitLab Personal Access Token

**When GitLab support is added:**
- Add a GitLab MCP server to `mcp.json`
- Update this workflow with GitLab-specific tool names
- URL parsing should auto-detect the platform
