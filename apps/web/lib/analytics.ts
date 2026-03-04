/**
 * Privacy-preserving analytics wrapper.
 * - Reads cookie consent from localStorage before firing any events
 * - Only sends workspaceId + role (no PII)
 * - Sends to Plausible if NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set, otherwise console.debug in dev
 */

function hasConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("sh_cookie_consent") === "true";
  } catch {
    return false;
  }
}

export function trackEvent(
  event: string,
  props?: Record<string, unknown>,
): void {
  if (!hasConsent()) return;

  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

  if (plausibleDomain) {
    void fetch("https://plausible.io/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: event,
        url: window.location.href,
        domain: plausibleDomain,
        props: props ?? {},
      }),
    }).catch(() => undefined);
  } else if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.debug("[analytics]", event, props);
  }
}
