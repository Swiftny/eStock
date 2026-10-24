---
name: Migration browser testing
description: Browser verification fallback when the platform testing helper is unavailable
---

The documented specialized testing helper may reject requests with
`Unknown config kind: testing` in this workspace. Use a direct Playwright browser
runner against the shared proxy instead of repeatedly trying the unavailable helper.

**Why:** The helper was unavailable during migration despite its skill being
present; direct Chromium testing successfully exercised the same application.

**How to apply:** Check current tool availability first. Keep browser output and
screenshots in ignored generated directories, and redact configured credentials
from test failures. Do not remove authentication to make screenshots possible.
