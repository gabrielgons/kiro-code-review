# Privacy Policy

**Code Review Power for Kiro**

Last updated: May 25, 2025

## Data Collection

This power does **not** collect, store, or transmit any personal data. It operates entirely within your local Kiro IDE environment.

## How It Works

- All code analysis is performed locally by the Kiro agent using the steering files included in this power.
- GitHub API interactions are handled exclusively through the official [@modelcontextprotocol/server-github](https://github.com/modelcontextprotocol/servers/tree/main/src/github) MCP server, using **your own** GitHub Personal Access Token.
- No data is sent to any third-party server owned or operated by the power author.

## Third-Party Services

This power integrates with:

| Service | Purpose | Privacy Policy |
|---------|---------|----------------|
| GitHub API (via MCP server) | Fetch PR data and post review comments | [GitHub Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement) |

## Your Token

Your GitHub Personal Access Token is configured locally in your MCP settings and is never accessed, stored, or transmitted by this power's code. It is used solely by the official GitHub MCP server running on your machine.

## Contact

If you have questions about this privacy policy, please open an issue at:
https://github.com/gabrielgons/kiro-code-review/issues

Or contact: gabriel.dsn.pack@gmail.com
