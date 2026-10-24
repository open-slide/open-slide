---
"@open-slide/core": patch
---

Oversized asset uploads without a Content-Length header now get a 413 response instead of a reset connection.
