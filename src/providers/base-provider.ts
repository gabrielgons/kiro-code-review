import {
  PRInfo,
  PRFile,
  ProjectGuideline,
  ReviewComment,
  Platform,
} from "../types.js";

/**
 * Abstract base class for Git platform providers.
 * Implement this interface to add support for new platforms (GitHub, GitLab, etc.)
 */
export interface GitPlatformProvider {
  readonly platform: Platform;

  /**
   * Fetches PR/MR metadata and diff
   */
  fetchPullRequest(
    owner: string,
    repo: string,
    number: number
  ): Promise<PRInfo>;

  /**
   * Gets the content of a specific file from the repository
   */
  getFileContent(
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<string>;

  /**
   * Lists files in a directory of the repository
   */
  listFiles(
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<string[]>;

  /**
   * Searches for documentation/guideline files in the repository
   */
  findGuidelineFiles(
    owner: string,
    repo: string,
    ref?: string
  ): Promise<ProjectGuideline[]>;

  /**
   * Detects the project stack by analyzing repository files
   */
  detectStack(
    owner: string,
    repo: string,
    ref?: string
  ): Promise<{
    languages: string[];
    frameworks: string[];
    buildTools: string[];
    testFrameworks: string[];
    linters: string[];
    packageManager: string | null;
  }>;

  /**
   * Posts review comments on a PR/MR
   */
  postReviewComments(
    owner: string,
    repo: string,
    number: number,
    comments: ReviewComment[],
    summary: string
  ): Promise<{ success: boolean; postedCount: number; errors: string[] }>;
}
