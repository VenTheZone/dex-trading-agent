/**
 * Version checking utility for auto-update notifications
 * Checks GitHub repository for new releases
 */

const GITHUB_REPO = "VenTheZone/dex-trading-agent";
const CURRENT_VERSION = "1.0.0"; // Will be synced with package.json
const VERSION_CHECK_INTERVAL = 1000 * 60 * 60; // Check every hour
const STORAGE_KEY = "dex_agent_last_version_check";

export interface VersionInfo {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  releaseUrl: string;
  releaseNotes?: string;
}

/**
 * Fetches the latest release information from GitHub
 */
export async function checkForUpdates(): Promise<VersionInfo | null> {
  try {
    // Check if we've checked recently
    const lastCheck = localStorage.getItem(STORAGE_KEY);
    if (lastCheck) {
      const timeSinceCheck = Date.now() - parseInt(lastCheck);
      if (timeSinceCheck < VERSION_CHECK_INTERVAL) {
        return null; // Don't check too frequently
      }
    }

    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      console.warn("Failed to check for updates:", response.statusText);
      return null;
    }

    const data = await response.json();
    const latestVersion = data.tag_name?.replace(/^v/, "") || data.name;

    // Store the check timestamp
    localStorage.setItem(STORAGE_KEY, Date.now().toString());

    const updateAvailable = compareVersions(latestVersion, CURRENT_VERSION) > 0;

    return {
      currentVersion: CURRENT_VERSION,
      latestVersion,
      updateAvailable,
      releaseUrl: data.html_url,
      releaseNotes: data.body,
    };
  } catch (error) {
    console.error("Error checking for updates:", error);
    return null;
  }
}

/**
 * Compares two semantic version strings
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split(".").map(Number);
  const parts2 = v2.split(".").map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }

  return 0;
}

/**
 * Gets update instructions based on deployment method
 */
export function getUpdateInstructions(isDocker: boolean): string {
  if (isDocker) {
    return `To update via Docker:
1. Stop the container: docker-compose down
2. Pull latest changes: git pull origin main
3. Rebuild: docker-compose up -d --build`;
  }

  return `To update:
1. Pull latest changes: git pull origin main
2. Install dependencies: pnpm install
3. Restart dev server: pnpm dev`;
}
