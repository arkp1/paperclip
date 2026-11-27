import { fetch as expoFetch } from "expo/fetch";

import { isSafeRemoteHttpUrl, resolveSafeRedirectUrl } from "./safeRemoteUrl";

export class UnsafeRemoteUrlError extends Error {
  constructor(message = "That destination is not allowed.") {
    super(message);
    this.name = "UnsafeRemoteUrlError";
  }
}

const MAX_REDIRECTS = 5;

function isRedirectStatus(status: number): boolean {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

export type SafeFetchResult = {
  response: Response;
  finalUrl: string;
};

/**
 * Fetches a remote HTTP(S) resource while validating every redirect hop before
 * it is requested. React Native's default redirect handling would otherwise
 * follow a public URL into loopback, private, or reserved address space.
 */
export async function fetchSafeRemote(
  rawUrl: string,
  init: RequestInit = {}
): Promise<SafeFetchResult> {
  let currentUrl = rawUrl;

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    if (!isSafeRemoteHttpUrl(currentUrl)) {
      throw new UnsafeRemoteUrlError();
    }

    const response = await expoFetch(currentUrl, {
      ...init,
      redirect: "manual",
    });

    if (response.url && !isSafeRemoteHttpUrl(response.url)) {
      await response.body?.cancel().catch(() => undefined);
      throw new UnsafeRemoteUrlError();
    }

    if (!isRedirectStatus(response.status)) {
      return { response, finalUrl: currentUrl };
    }

    if (redirects === MAX_REDIRECTS) {
      await response.body?.cancel().catch(() => undefined);
      throw new Error("The remote resource redirected too many times.");
    }

    const location = response.headers.get("location");
    await response.body?.cancel().catch(() => undefined);
    if (!location) {
      throw new Error("The remote redirect was invalid.");
    }

    try {
      currentUrl = resolveSafeRedirectUrl(currentUrl, location);
    } catch {
      throw new UnsafeRemoteUrlError();
    }
  }

  throw new Error("The remote resource could not be fetched.");
}
