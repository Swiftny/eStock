/** Read a cookie from a standard Fetch request. */
export function readCookie(request: Request, name: string): string | undefined {
  for (const cookie of (request.headers.get("cookie") || "").split(";")) {
    const index = cookie.indexOf("=");
    if (index < 0 || cookie.slice(0, index).trim() !== name) continue;
    try {
      return decodeURIComponent(cookie.slice(index + 1).trim());
    } catch {
      return undefined;
    }
  }
  return undefined;
}
