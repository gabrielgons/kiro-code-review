import { ParsedPRUrl, Platform } from "../types.js";

/**
 * Parses a Pull Request URL and extracts platform, owner, repo, and PR number.
 * Designed to be extensible for GitLab support in the future.
 */
export function parsePRUrl(url: string): ParsedPRUrl {
  // GitHub format: https://github.com/{owner}/{repo}/pull/{number}
  const githubRegex =
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)\/?.*$/;

  // GitLab format: https://gitlab.com/{group}/{project}/-/merge_requests/{number}
  const gitlabRegex =
    /^https?:\/\/gitlab\.com\/([^/]+(?:\/[^/]+)*)\/([^/]+)\/-\/merge_requests\/(\d+)\/?.*$/;

  const githubMatch = url.match(githubRegex);
  if (githubMatch) {
    return {
      platform: "github",
      owner: githubMatch[1],
      repo: githubMatch[2],
      number: parseInt(githubMatch[3], 10),
    };
  }

  const gitlabMatch = url.match(gitlabRegex);
  if (gitlabMatch) {
    return {
      platform: "gitlab",
      owner: gitlabMatch[1],
      repo: gitlabMatch[2],
      number: parseInt(gitlabMatch[3], 10),
    };
  }

  throw new Error(
    `Invalid PR URL format. Supported formats:\n` +
      `  GitHub: https://github.com/{owner}/{repo}/pull/{number}\n` +
      `  GitLab: https://gitlab.com/{group}/{project}/-/merge_requests/{number}`
  );
}

/**
 * Detects the platform from a URL without full parsing
 */
export function detectPlatform(url: string): Platform {
  if (url.includes("github.com")) return "github";
  if (url.includes("gitlab.com")) return "gitlab";
  throw new Error("Unsupported platform. Only GitHub and GitLab are supported.");
}
