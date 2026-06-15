/**
 * Plausible custom events — no-ops when analytics is disabled.
 * Events: Compare, Share, Profile (see docs/ROADMAP.md Phase 6).
 */
export function trackEvent(name, props = {}) {
  if (typeof window === "undefined" || typeof window.plausible !== "function") {
    return;
  }

  const cleanProps = Object.fromEntries(
    Object.entries(props).filter(([, value]) => value != null && value !== "")
  );

  if (Object.keys(cleanProps).length > 0) {
    window.plausible(name, { props: cleanProps });
  } else {
    window.plausible(name);
  }
}

export function trackCompare(states) {
  const abbrs = Array.isArray(states) ? states : [];
  if (abbrs.length < 2) {
    return;
  }

  trackEvent("Compare", {
    states: abbrs.join(","),
    count: abbrs.length,
  });
}

export function trackShare(type) {
  trackEvent("Share", { type });
}

export function trackProfile(profileId) {
  trackEvent("Profile", { profile: profileId || "overall" });
}
