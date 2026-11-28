export type GithubPreview = {
  title: string;
  description: null;
  siteName: "GitHub";
  canonicalUrl: string;
  imageUrl: string;
};

const GITHUB_RESERVED_OWNERS = new Set([
  "about",
  "collections",
  "enterprise",
  "explore",
  "features",
  "join",
  "login",
  "marketplace",
  "notifications",
  "orgs",
  "pricing",
  "readme",
  "security",
  "settings",
  "site",
  "sponsors",
  "topics",
  "users",
]);

/**
 * GitHub's generated social card gives every public repository a stable
 * thumbnail without relying on the repository page's Open Graph tags.
 */
export function githubRepositoryPreview(rawUrl: string): GithubPreview | null {
  try {
    const url = new URL(rawUrl);
    if (url.hostname.toLowerCase().replace(/^www\./, "") !== "github.com") {
      return null;
    }
    const [owner, repo] = url.pathname.split("/").filter(Boolean);
    if (
      !owner ||
      !repo ||
      GITHUB_RESERVED_OWNERS.has(owner.toLowerCase()) ||
      !/^[a-z0-9_.-]+$/i.test(owner) ||
      !/^[a-z0-9_.-]+$/i.test(repo)
    ) {
      return null;
    }
    const name = repo.replace(/\.git$/i, "");
    if (!name) {
      return null;
    }
    return {
      title: `${owner}/${name}`,
      description: null,
      siteName: "GitHub",
      canonicalUrl: `https://github.com/${owner}/${name}`,
      imageUrl: `https://opengraph.githubassets.com/1/${owner}/${name}`,
    };
  } catch {
    return null;
  }
}
