/**
 * Utilities for interacting with GitHub via a GitHub App Installation token.
 * This is the required architecture for all background agentic operations.
 */

/**
 * Generate a JSON Web Token (JWT) to authenticate as a GitHub App.
 * Requires GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY.
 */
async function generateGitHubAppJWT(): Promise<string> {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

  if (!appId || !privateKey) {
    throw new Error("GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY must be set");
  }

  // A basic JWT implementation for RS256 using Web Crypto API.
  // In a Node/Edge environment, we could use a library, but here we manually construct it if needed.
  // We can use a dynamic import for 'jose' if installed, but let's assume we can fetch it or use native.
  
  // NOTE: Convex has 'jose' or we can just import it.
  const { SignJWT, importPKCS8 } = await import("jose");
  
  const privateKeyObj = await importPKCS8(privateKey, "RS256");

  const jwt = await new SignJWT({
    iat: Math.floor(Date.now() / 1000) - 60,
    exp: Math.floor(Date.now() / 1000) + (10 * 60),
    iss: appId,
  })
    .setProtectedHeader({ alg: "RS256" })
    .sign(privateKeyObj);

  return jwt;
}

/**
 * Gets a short-lived installation access token for a specific repository.
 */
export async function getInstallationTokenForRepo(repoName: string): Promise<string> {
  const jwt = await generateGitHubAppJWT();

  // 1. Get the installation ID for the repository
  const instRes = await fetch(`https://api.github.com/repos/${repoName}/installation`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "OpenGrove-Agent",
    },
  });

  if (!instRes.ok) {
    console.error("Failed to fetch installation ID", await instRes.text());
    throw new Error(`Could not find GitHub App installation for repo: ${repoName}`);
  }

  const instData = await instRes.json();
  const installationId = instData.id;

  // 2. Create an installation access token
  const tokenRes = await fetch(`https://api.github.com/app/installations/${installationId}/access_tokens`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "OpenGrove-Agent",
    },
  });

  if (!tokenRes.ok) {
    console.error("Failed to generate installation token", await tokenRes.text());
    throw new Error("Could not generate GitHub App installation token");
  }

  const tokenData = await tokenRes.json();
  return tokenData.token;
}
