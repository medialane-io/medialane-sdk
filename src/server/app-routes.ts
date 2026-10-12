const SEG = "[^/]+";

const PUBLIC_ROUTES: Record<string, RegExp[]> = {
  GET: [
    "orders", `orders/${SEG}`, `orders/token/${SEG}/${SEG}`, `orders/user/${SEG}`, `orders/received/${SEG}`, "orders/counter-offers",
    "tokens", `tokens/owned/${SEG}`, `tokens/${SEG}/${SEG}`, `tokens/${SEG}/${SEG}/(history|comments|remixes)`,
    "collections", `collections/${SEG}`, `collections/${SEG}/tokens`, `collections/${SEG}/profile`,
    "activities", `activities/${SEG}`, "search", "metadata/resolve",
    "creators", `creators/${SEG}/profile`, `creators/by-username/${SEG}`, `creators/${SEG}/hidden`,
    "coins", "coins/prices", "coins/claims", `coins/${SEG}`, `coins/${SEG}/guarantees`, `pop/${SEG}/claim-info`,
    "drops", `drops/${SEG}`, `drops/${SEG}/mints`, `drops/${SEG}/state`,
    "rewards", "rewards/config", "rewards/batch", `rewards/${SEG}`, `rewards/${SEG}/events`,
    `club/${SEG}/${SEG}`, `club/${SEG}/${SEG}/member/${SEG}`, `tickets/${SEG}/${SEG}`, `tickets/${SEG}/count`, `ipnft/${SEG}/${SEG}`,
    "stats", "prices", `remix-offers/${SEG}`,
    "sponsorship/offers", `sponsorship/offers/${SEG}`, `sponsorship/offers/${SEG}/bids`,
    "sponsorship/proposals", `sponsorship/proposals/${SEG}`, "sponsorship/licenses", `sponsorship/licenses/${SEG}`,
    "auth/email/exists",
  ].map((p) => new RegExp(`^${p}$`)),
  POST: [
    "auth/email/(request-code|verify-code|register-account|confirm)",
    "auth/siws/(nonce|verify)",
    "users/register",
  ].map((p) => new RegExp(`^${p}$`)),
};

export function isPublicAppRoute(method: string, path: string): boolean {
  if (path.split("/").some((s) => s === "." || s === ".." || s === "")) return false;
  return (PUBLIC_ROUTES[method.toUpperCase()] ?? []).some((re) => re.test(path));
}
