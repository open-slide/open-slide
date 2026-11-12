---
"@open-slide/core": patch
---

Keep the Enter that confirms an IME candidate from sending an agent message in Safari and other WebKit browsers, where that keydown reports `isComposing: false` with `keyCode` 229.
