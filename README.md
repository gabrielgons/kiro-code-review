# Code Review Power for Kiro

A Kiro Power that provides automated, senior-level code review for Pull Requests. Pragmatic by design — no nitpicking, just real value.

## What It Does

1. You paste a GitHub PR URL
2. The power fetches the diff, detects the tech stack, and finds project guidelines
3. Analyzes code against 15+ principle categories (OWASP, SOLID, KISS, DRY, Clean Code, Architecture, Stack-Specific...)
4. Generates a severity-classified report (🔴 Critical / 🟠 Medium / 🟢 Suggestion)
5. Asks if you want to post inline comments directly on the PR

## Installation

### Prerequisites

- [Kiro IDE](https://kiro.dev) installed
- Node.js 18+ (for npx)
- GitHub Personal Access Token with `repo` scope

### Option 1: Install via Kiro Power Registry (Recommended)

Once published to the Kiro registry, install directly from the IDE power manager.

### Option 2: Install from GitHub Repository

1. Clone this repository:
```bash
git clone https://github.com/gabrielgons/kiro-code-review.git
```

2. In Kiro, add the power by pointing to the local directory.

### Option 3: Manual Configuration

Add to your `~/.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

> **Note:** If you already have the GitHub MCP server configured, you only need the power's steering files — no additional MCP setup required.

## Usage

Once installed, simply paste a PR URL in Kiro:

```
https://github.com/owner/repo/pull/123
```

Or use natural language:
- "Review this PR: https://github.com/..."
- "Faça o code review desse PR"
- "Analyze this pull request"

The power activates automatically and starts the review.

## What Gets Reviewed

| Category | What's Checked |
|----------|---------------|
| **Security** | OWASP Top 10, hardcoded secrets, injection, XSS, auth issues |
| **Architecture** | Cohesion, coupling, separation of concerns, project pattern adherence |
| **SOLID** | Single responsibility, open/closed, Liskov, interface segregation, DI |
| **KISS** | Over-engineering, premature optimization, unnecessary abstractions |
| **DRY** | Code duplication, missed abstractions, repeated patterns |
| **Clean Code** | Naming, function size, comments, error handling, organization |
| **Performance** | N+1 queries, memory leaks, blocking operations, missing pagination |
| **Error Handling** | Missing catches, swallowed errors, unhandled promises |
| **Testing** | Missing tests, untestable code, edge cases |
| **Stack-Specific** | Best practices for your exact tech stack (see below) |

### Stack-Specific Knowledge

The power adapts its review to your stack:

- **Java/Spring Boot** — Transaction scope, DI patterns, JPA pitfalls
- **.NET/C#** — async/await, DI lifetime, EF tracking
- **Node.js/TypeScript** — Event loop, floating promises, strict mode
- **React** — Render performance, hook rules, composition
- **Vue.js** — Composition API, reactivity, computed caching
- **Python/Django/FastAPI** — N+1 queries, type hints, async patterns
- **Go** — Error wrapping, goroutine lifecycle, context propagation
- **PostgreSQL** — Index awareness, migration safety
- **Kubernetes** — Resource limits, probes, image pinning
- **AWS** — IAM least privilege, VPC rules

## Severity Levels

| Level | Color | Meaning | Action |
|-------|-------|---------|--------|
| Critical | 🔴 | Security flaws, crashes, data loss | Must fix before merge |
| Medium | 🟠 | Bad practices, potential bugs, maintainability | Should be addressed |
| Suggestion | 🟢 | Nice-to-haves, minor optimizations | Optional |

## Project Guidelines Priority

If your project has documentation files like `CONTRIBUTING.md`, `docs/architecture.md`, or `docs/coding-standards.md`, these take **absolute priority** over general best practices.

## Structure

```
kiro-code-review/
├── POWER.md                    # Power documentation & activation keywords
├── mcp.json                    # MCP server config (official GitHub server)
├── steering/
│   ├── review-principles.md    # All review criteria (15 sections)
│   ├── review-workflow.md      # Step-by-step workflow
│   └── report-template.md     # Report format specification
├── README.md
└── .gitignore
```

**No custom server code.** The intelligence lives entirely in the steering files. The GitHub API interaction is handled by the official `@modelcontextprotocol/server-github`.

## Contributing

Contributions are welcome! Areas where you can help:

- Add more stack-specific best practices
- Improve review principles
- Add GitLab support (future)
- Translate steering files to other languages
- Report false positives or missing checks

## Future Roadmap

- [ ] GitLab Merge Request support
- [ ] Bitbucket PR support
- [ ] Custom rule definitions via `.code-review.yml`
- [ ] Team-specific review profiles
- [ ] Integration with SonarQube findings

## License

MIT
