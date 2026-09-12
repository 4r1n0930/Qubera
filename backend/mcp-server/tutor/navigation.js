/**
 * Navigation whitelist shared by the MCP tools and agents.
 *
 * The LLM is never allowed to produce arbitrary URLs. Every navigation a tutor
 * requests must resolve to one of these known QUBERA screen keys. The `learn`
 * screen additionally accepts an optional lesson topic, which deep-links to a
 * matching lesson in the Learn page (`?q=`), still fully server-whitelisted.
 */

export const NAV_WHITELIST = [
  "dashboard",
  "learn",
  "quantumLab",
  "progress",
  "leaderboard",
  "profile",
  "settings",
  "resources",
];

/** Maps a whitelisted page key to its dashboard route (base, no query). */
export const ROUTES = {
  dashboard: "/dashboard",
  learn: "/dashboard/learn",
  quantumLab: "/dashboard/quantum-lab",
  progress: "/dashboard/progress",
  leaderboard: "/dashboard/leaderboard",
  profile: "/dashboard/profile",
  settings: "/dashboard/settings",
  resources: "/dashboard/resources",
};

/** Resolves the route for a page, appending a lesson deep link for `learn`.
 *
 * Passing a `lesson` for the `learn` screen appends a `q` query param that the
 * frontend uses to auto-select the matching lesson.
 */
export function routeFor(page, lesson) {
  const base = ROUTES[page] || null;
  if (base === null) return null;
  if (page === "learn" && lesson && typeof lesson === "string") {
    return `${base}?q=${encodeURIComponent(lesson.slice(0, 120))}`;
  }
  return base;
}

/** Human-friendly label used in tutor activity messages. */
export const LABELS = {
  dashboard: "Dashboard",
  learn: "Learning path",
  quantumLab: "Quantum Playground",
  progress: "Progress",
  leaderboard: "Leaderboard",
  profile: "Profile",
  settings: "Settings",
  resources: "Resources",
};

export function isAllowedPage(page) {
  return NAV_WHITELIST.includes(page);
}

export function labelFor(page) {
  return LABELS[page] || page;
}