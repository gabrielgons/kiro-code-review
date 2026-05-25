# Code Review Power for Kiro

A Kiro Power that provides automated, senior-level code review for Pull Requests. Analyzes code against industry-standard principles and project-specific guidelines.

## Features

- **Comprehensive Analysis**: Reviews code against OWASP, SOLID, KISS, DRY, Clean Code, and 10+ other principle categories
- **Project-Aware**: Detects tech stack and respects project documentation (architecture docs, coding standards, etc.)
- **Severity Classification**: Color-coded findings (Red/Orange/Green) with actionable suggestions
- **Report Generation**: Creates detailed `.md` reports with code snippets and improvement explanations
- **GitHub Integration**: Posts inline review comments directly on PRs at the exact lines
- **Extensible**: Architecture designed to support GitLab in the future

## Installation

### Prerequisites

- [Kiro IDE](https://kiro.dev) installed
- Node.js 18+
- GitHub Personal Access Token with `repo` scope

### Setup

1. Clone or download this power to your local machine
2. Install dependencies:

```bash
npm install
```

3. Build the TypeScript source:

```bash
npm run build
```

4. Set your GitHub token as an environment variable:

```bash
export GITHUB_TOKEN=your_token_here
```

5. Install the power in Kiro by adding the path to your power configuration

### Kiro Configuration

Add to your `~/.kiro/settings/mcp.json` under Powers:

```json
{
  "mcpServers": {
    "code-review-server": {
      "command": "node",
      "args": ["/path/to/kiro-code-review/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "your_github_token"
      }
    }
  }
}
```

## Usage

Once installed, simply mention "code review" or provide a PR URL in Kiro:

```
Review this PR: https://github.com/owner/repo/pull/123
```

The power will:
1. Fetch the PR diff and metadata
2. Detect the project stack
3. Search for project-specific guidelines
4. Analyze code against all principles
5. Generate a detailed `.md` report
6. Ask if you want to post comments on GitHub

## Severity Levels

| Level | Color | Meaning |
|-------|-------|---------|
| Critical | :red_circle: Red | Security vulnerabilities, critical bugs, blocking issues |
| Medium | :orange_circle: Orange | Bad practices, potential bugs, maintainability concerns |
| Low | :green_circle: Green | Style suggestions, minor optimizations, nice-to-haves |

## Review Principles

The power evaluates code against:

- **Security**: OWASP Top 10 (Injection, XSS, Auth, Data Exposure, etc.)
- **SOLID**: Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion
- **KISS**: Keep It Simple, Stupid - flags over-engineering and unnecessary complexity
- **DRY**: Don't Repeat Yourself - identifies code duplication
- **Clean Code**: Naming, function size, comments, formatting
- **Performance**: N+1 queries, memory leaks, unnecessary computation
- **Error Handling**: Missing catches, empty handlers, error propagation
- **Testing**: Missing tests, untestable code, edge cases
- **API Design**: REST conventions, status codes, validation
- **Architecture**: Separation of concerns, coupling, cohesion
- **Documentation**: Missing docs, outdated comments
- **Git Hygiene**: PR size, commit quality, debug code

## Project Guidelines Priority

If the project contains documentation files like:
- `CONTRIBUTING.md`
- `docs/architecture.md`
- `docs/coding-standards.md`
- `STYLEGUIDE.md`

These take **absolute priority** over general best practices during review.

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Architecture

```
kiro-code-review/
├── POWER.md              # Power documentation & frontmatter
├── mcp.json              # MCP server configuration
├── steering/             # Steering files (workflows & principles)
│   ├── review-principles.md   # All review criteria
│   ├── review-workflow.md     # Step-by-step workflow
│   └── report-template.md    # Report format specification
├── src/                  # MCP server source code
│   ├── index.ts               # Server entry point & tool definitions
│   ├── types.ts               # TypeScript type definitions
│   ├── utils/
│   │   └── url-parser.ts      # PR URL parsing (GitHub/GitLab)
│   └── providers/
│       ├── base-provider.ts   # Abstract provider interface
│       ├── github-provider.ts # GitHub API implementation
│       └── index.ts           # Provider exports
├── package.json
└── tsconfig.json
```

## Future Roadmap

- [ ] GitLab Merge Request support
- [ ] Bitbucket PR support
- [ ] Custom rule definitions via `.code-review.yml`
- [ ] Auto-fix suggestions using AI
- [ ] Historical review tracking
- [ ] Team-specific review profiles

## License

MIT
