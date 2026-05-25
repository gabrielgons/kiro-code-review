# Code Review Workflow

## Overview

This steering file defines the step-by-step workflow for conducting a complete code review using this power. Follow these steps in order for every review.

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
- Extract: `owner`, `repo`, `pr_number`
- If invalid, ask the user to provide a correct URL

---

## Step 2: Fetch PR Data

Use `fetch_pull_request` tool with the extracted parameters.

**Data to collect:**
- PR title and description
- Author and branch info
- List of changed files with status (added/modified/deleted)
- Full unified diff for each file
- Number of additions and deletions

**Error handling:**
- If 404: Repository or PR not found - verify access
- If 401: Token invalid or missing permissions
- If rate limited: Inform user and suggest waiting

---

## Step 3: Detect Project Stack

Use `detect_project_stack` tool on the repository.

**Detection strategy:**
1. Check `package.json` for Node.js/JS/TS projects
2. Check `requirements.txt` / `pyproject.toml` for Python
3. Check `go.mod` for Go
4. Check `pom.xml` / `build.gradle` for Java
5. Check `Cargo.toml` for Rust
6. Check `Gemfile` for Ruby
7. Analyze file extensions in changed files
8. Check for framework-specific files (next.config.js, angular.json, etc.)

**Output:**
- Primary language(s)
- Framework(s) detected
- Build tool / package manager
- Test framework (if detectable)
- Linter/formatter configuration (if present)

---

## Step 4: Find Project Guidelines

Use `find_project_guidelines` tool to search for documentation files.

**Files to search for (priority order):**
1. `CONTRIBUTING.md` - Contribution guidelines
2. `docs/architecture.md` - Architecture documentation
3. `docs/coding-standards.md` - Coding standards
4. `.github/PULL_REQUEST_TEMPLATE.md` - PR template
5. `docs/development.md` - Development guidelines
6. `STYLEGUIDE.md` - Style guide
7. `docs/api-guidelines.md` - API design guidelines
8. Any `.md` file in `docs/` directory with relevant keywords
9. `.eslintrc` / `.prettierrc` / `tsconfig.json` - Tool configurations as implicit standards
10. `ADR/` directory - Architecture Decision Records

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

4. **Code quality** (Orange severity)
   - DRY violations
   - KISS violations
   - Error handling gaps
   - Missing validation

5. **Maintainability** (Green/Orange severity)
   - Clean Code violations
   - Naming issues
   - Documentation gaps
   - Test coverage concerns

6. **Suggestions** (Green severity)
   - Performance optimizations
   - Better patterns/approaches
   - Style improvements
   - Modern language features

**For each finding, capture:**
- File path
- Line number(s) - must be within the diff
- Severity (green/orange/red)
- Category (Security, Architecture, Quality, etc.)
- Description of the issue
- Explanation of WHY it's a problem
- Suggested fix with code example (when applicable)

---

## Step 6: Generate Report

Use `generate_review_report` tool with all findings.

**Report structure:**

```markdown
# Code Review Report

## PR Information
- **Title**: {pr_title}
- **Author**: {pr_author}
- **Branch**: {source_branch} -> {target_branch}
- **Files Changed**: {count}
- **Additions**: +{additions} / Deletions: -{deletions}

## Summary

| Severity | Count | 
|----------|-------|
| :red_circle: Critical | X |
| :orange_circle: Medium | X |
| :green_circle: Low/Suggestion | X |

## Overall Assessment

{Brief paragraph on code quality, main concerns, and positive aspects}

## Detailed Findings

### :red_circle: Critical Issues

#### [{Category}] {Title}
- **File**: `{file_path}`
- **Line(s)**: {line_numbers}
- **Principle**: {violated_principle}

**Problem:**
{Description of the issue}

**Current Code:**
```{language}
{problematic_code}
```

**Suggested Fix:**
```{language}
{improved_code}
```

**Why this matters:** {Explanation of impact}

---

### :orange_circle: Medium Issues
{Same format as above}

---

### :green_circle: Suggestions
{Same format as above}

## Reviewed Principles
- [x] Security (OWASP)
- [x] SOLID
- [x] KISS
- [x] DRY
- [x] Clean Code
- [x] Performance
- [x] Error Handling
- [x] Project Standards (if applicable)

## Notes
{Any additional observations, positive feedback, or general recommendations}
```

---

## Step 7: Present Overview to User

After generating the report, present a concise overview:

```
## Review Complete!

**PR**: {title} by {author}
**Files analyzed**: {count}

### Findings Summary:
- :red_circle: {X} critical issues requiring immediate attention
- :orange_circle: {X} medium issues that should be addressed  
- :green_circle: {X} suggestions for improvement

### Top Critical Issues:
1. {Brief description of most critical finding}
2. {Brief description of second most critical finding}

The full report has been saved to `{report_filename}`.
```

---

## Step 8: Offer GitHub Comments

Ask the user:

> "Would you like me to post these review comments as inline comments on the GitHub PR? I can post:
> - All findings (X comments)
> - Only critical and medium issues (X comments)  
> - Only critical issues (X comments)
> 
> Or would you prefer to review the report first and select specific comments to post?"

**If user agrees:**

Use `post_review_comments` tool to create a PR review with:
- A summary comment at the PR level
- Inline comments on the specific lines in the diff
- Each comment formatted with severity emoji, description, and suggestion

**Comment format for GitHub:**

```markdown
{severity_emoji} **[{Category}]** {Title}

{Problem description}

**Suggestion:**
```{language}
{suggested_code}
```

> {Why this matters - brief explanation}
```

**Important considerations for posting:**
- Comments must reference lines that exist in the diff (not arbitrary lines)
- Use `side: "RIGHT"` for additions, `side: "LEFT"` for deletions
- Group all comments into a single review submission when possible
- Use `COMMENT` event (not `APPROVE` or `REQUEST_CHANGES`) to be non-blocking

---

## Error Handling Throughout Workflow

| Error | Action |
|-------|--------|
| Invalid PR URL | Ask user for correct URL format |
| Repository not accessible | Check token permissions, inform user |
| Empty diff | Inform user the PR has no code changes |
| Rate limit reached | Inform user, suggest waiting |
| Comment posting fails | Save comments locally, report which failed |
| Large PR (>50 files) | Warn user, suggest reviewing in batches |

---

## GitLab Support (Future)

The workflow is designed to be extensible for GitLab:

**Differences to implement:**
- URL format: `https://gitlab.com/{group}/{project}/-/merge_requests/{number}`
- API endpoints: GitLab Merge Request API
- Comment format: GitLab Discussion/Note API
- Authentication: GitLab Personal Access Token or OAuth

**Architecture consideration:**
- The MCP server tools should accept a `platform` parameter (defaulting to "github")
- URL parsing logic should detect the platform automatically
- A provider abstraction should be used internally to route to GitHub or GitLab
