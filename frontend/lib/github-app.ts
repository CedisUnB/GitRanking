import { SignJWT } from "jose";
import { createPrivateKey } from "crypto";

/**
 * Decodes the base64-encoded PEM private key stored in GITHUB_APP_PRIVATE_KEY
 * and returns the raw PEM string.
 *
 * GitHub App private keys are PKCS#1 format ("BEGIN RSA PRIVATE KEY").
 * Node's createPrivateKey handles PKCS#1 natively, and jose accepts
 * a Node KeyObject directly — no PKCS#8 conversion needed.
 */
function toPemFromBody(base64Body: string): string {
  const normalized = base64Body.replace(/\s+/g, "");
  const chunks = normalized.match(/.{1,64}/g) ?? [];
  return [
    "-----BEGIN RSA PRIVATE KEY-----",
    ...chunks,
    "-----END RSA PRIVATE KEY-----",
  ].join("\n");
}


/**
 * Converts `GITHUB_APP_PRIVATE_KEY` to a `KeyObject`.
 * Accepts: PEM, base64 of PEM, or base64 body only.
 */
function getPrivateKey() {
  const raw = process.env.GITHUB_APP_PRIVATE_KEY?.trim();
  if (!raw) throw new Error("GITHUB_APP_PRIVATE_KEY env var is not set");

  const maybePem = raw.replace(/\\n/g, "\n");
  if (maybePem.includes("BEGIN") && maybePem.includes("PRIVATE KEY")) {
    return createPrivateKey(maybePem);
  }
  const decoded = Buffer.from(raw, "base64").toString("utf-8");
  if (decoded.includes("BEGIN") && decoded.includes("PRIVATE KEY")) {
    return createPrivateKey(decoded);
  }
  return createPrivateKey(toPemFromBody(raw));
}

/**
 * Creates a signed JWT to authenticate as the GitHub App itself.
 * GitHub requires the JWT to expire within 10 minutes.
 */
async function createAppJwt(): Promise<string> {
  const appId = process.env.GITHUB_APP_ID;
  if (!appId) throw new Error("GITHUB_APP_ID env var is not set");

  const privateKey = getPrivateKey();
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({})
    .setProtectedHeader({ alg: "RS256" })
    .setIssuedAt(now - 60) // 60s in the past to account for clock drift
    .setExpirationTime(now + 60 * 9) // 9 minutes
    .setIssuer(appId)
    .sign(privateKey);
}

/**
 * Exchanges a GitHub App installation ID for a short-lived installation
 * access token that can be used to call GitHub APIs on behalf of that installation.
 */
export async function getInstallationToken(installationId: number): Promise<string> {
  const appJwt = await createAppJwt();

  const res = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${appJwt}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get installation token: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.token as string;
}

/**
 * Finds the installation ID of this GitHub App for a given user.
 * Uses the user's OAuth token to call GET /user/installations.
 * Returns null if the user has not installed the app.
 */
export async function getUserInstallationId(
  userOAuthToken: string
): Promise<number | null> {
  const res = await fetch("https://api.github.com/user/installations", {
    headers: {
      Authorization: `Bearer ${userOAuthToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch user installations: ${res.status} ${text}`);
  }

  const data = await res.json();
  const appId = Number(process.env.GITHUB_APP_ID);

  const installation = (data.installations as Array<{ id: number; app_id: number }>).find(
    (i) => i.app_id === appId
  );

  return installation ? installation.id : null;
}

/**
 * Returns the list of repositories the user has explicitly authorized
 * for this GitHub App installation.
 */
export async function getInstallationRepos(
  installationId: number
): Promise<Array<{ id: number; full_name: string; private: boolean; description: string | null }>> {
  const token = await getInstallationToken(installationId);

  const repos: Array<{ id: number; full_name: string; private: boolean; description: string | null }> = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `https://api.github.com/installation/repositories?per_page=100&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to fetch installation repos: ${res.status} ${text}`);
    }

    const data = await res.json();
    repos.push(...data.repositories);

    if (repos.length >= data.total_count || data.repositories.length < 100) break;
    page++;
  }

  return repos;
}
