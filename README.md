# BatteryBuddy Stream Deck Plugin

Display your devices' battery state directly on Elgato Stream Deck or Stream
Deck Mobile. Choose a device for each key and see its category icon surrounded
by a colour-coded battery ring.

## Download and setup

1. Install or update [BatteryBuddy](https://github.com/Dergln/BatteryBuddy-Public/releases/latest) to version 1.0.15 or newer.
2. Download the `.streamDeckPlugin` installer from the [latest plugin release](https://github.com/Dergln/BatteryBuddy-Plugin-Elgato-Public/releases/latest).
3. Open it to install through the Stream Deck desktop app.
4. Start BatteryBuddy, add **BatteryBuddy Battery** to a key, and select a device.

**Requirements:** Windows 10 or newer, Stream Deck software 7.1 or newer, and
BatteryBuddy running as the same Windows user. No administrator rights are needed.
You can test without physical Stream Deck hardware by pairing Stream Deck Mobile
with the desktop app.

## Features

- Independent device selection for each key, remembered across restarts.
- Category icons inside a four-segment ring: four green segments for full, three
  amber for medium, two red for low and one burgundy for critical.
- Ring colours follow BatteryBuddy's effective device thresholds; saved device
  profiles take precedence over global defaults. Saving settings updates the
  ring immediately.
- A generic icon and neutral ring for offline, unavailable, unknown or unselected
  devices, rather than a misleading reading.
- No generated key title by default, keeping text off the icon. Add a custom
  title or image in Stream Deck if desired.
- Local, read-only communication with BatteryBuddy; no HTTP server or telemetry.

The key title is empty by default. User-defined titles and custom images remain
available in Stream Deck; a custom image replaces the dynamic battery icon.

The screenshots show the current key design and per-device setup, with examples
of the live ring at different battery states.

<img width="800" height="572" alt="Stream Deck showing the BatteryBuddy key and device selector" src="https://github.com/user-attachments/assets/4be03e2d-1e30-4f60-a1f0-a4d440ccab04" />

<img width="800" height="341" alt="BatteryBuddy key with green and amber battery rings beside device settings" src="https://github.com/user-attachments/assets/5635633e-56e4-40fb-988a-34a0de2a6991" />

<img width="800" height="341" alt="BatteryBuddy key with a red low-battery ring beside device settings" src="https://github.com/user-attachments/assets/7b7f7946-4fff-4629-b6a3-56fbeaf2f43f" />

<img width="800" height="340" alt="BatteryBuddy key with a burgundy critical-battery ring beside device settings" src="https://github.com/user-attachments/assets/64890208-ccc0-4895-8a06-0b6ae6d92930" />

The interface follows Stream Deck's language: English, German, French, Spanish,
Japanese, Korean, Simplified Chinese and Traditional Chinese. This includes the
action name/tooltip, device selector and categories, and status messages.
Custom titles are not translated. Unsupported languages fall back to English;
restart Stream Deck after changing its language. Translations are AI-reviewed
drafts, not certified native-speaker translations.

Grey means a neutral state, or an older
BatteryBuddy build that does not supply colours; update BatteryBuddy if
percentages appear but the icon remains grey.

## Privacy and security

The plugin reads only a local, same-user Windows named pipe. It cannot change
BatteryBuddy settings or send it commands. Stream Deck provides the local
WebSocket used by the settings panel. A process already compromised under the
same Windows user is not isolated by this integration.

Download from this repository's [Releases](https://github.com/Dergln/BatteryBuddy-Plugin-Elgato-Public/releases)
and verify the installer against `SHA256SUMS.txt`. A checksum is not a digital
signature. This release has not been submitted to the Elgato Marketplace.

## Build from source

On Windows with Node.js 24 or newer:

```powershell
npm ci
npm run typecheck
npm run pack
```

The installer is written to `dist`. This repository contains curated released
source, not private development history or internal test infrastructure.
The source for each installer is available at its corresponding release tag.

Public CI logs Node.js 24 and npm versions, keeps typechecking and production
validation/packaging, and requires exactly one nonempty installer. Only
superseded runs of the same pull request are cancelled; branch, tag and manually
dispatched builds remain independent. The build job has a 15-minute deadline.

## Feedback

Report ordinary bugs in [Issues](https://github.com/Dergln/BatteryBuddy-Plugin-Elgato-Public/issues).
Include the versions and reproduction steps; remove personal data from logs and
screenshots. For vulnerabilities use [private reporting](SECURITY.md), not a public issue.

## License and credits

The plugin's own code and original battery artwork are licensed under
[GNU GPL version 3](LICENSE.md), like BatteryBuddy. Bundled libraries retain
their MIT licences; see [third-party notices](com.dergln.batterybuddy.streamdeck.sdPlugin/THIRD-PARTY-NOTICES.md).

This is an independent integration, not an endorsement by Elgato or Corsair.
