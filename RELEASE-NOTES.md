# BatteryBuddy Stream Deck Plugin 1.1.0

Adds all eight languages supported by Stream Deck: English, German, French,
Spanish, Japanese, Korean, Simplified Chinese and Traditional Chinese.

- Action names/tooltips, device selector/categories, status messages and generated
  key-state text follow the Stream Deck application language.
- Device names, saved selections, percentages, colours and custom titles remain
  unchanged.
- Unsupported languages fall back to English. Restart Stream Deck after changing
  its language. Translations are AI-reviewed drafts, not native-speaker certified.

Existing features remain available:

- Select a BatteryBuddy device independently for each key.
- See battery percentages, charging status and effective threshold colours.
- Selections persist across restarts; colours update when BatteryBuddy settings change.
- Neutral icons and readable status text cover offline, unknown and unavailable states.
- 10px default titles, with user title/font/image customization retained.
- Read-only local communication, without an HTTP server or administrator rights.

Requires BatteryBuddy 1.0.5 or newer and Stream Deck software 7.1 or newer.
Install the `.streamDeckPlugin` asset by opening it in Stream Deck.
No Elgato Marketplace submission is implied.

Verify the installer against `SHA256SUMS.txt`. Source and GPLv3/MIT licence texts
are included in the repository and installer as applicable.
