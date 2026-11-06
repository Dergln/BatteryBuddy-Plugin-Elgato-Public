# Security

Please do not report security vulnerabilities in public issues. Use
[GitHub private vulnerability reporting](https://github.com/Dergln/BatteryBuddy-Plugin-Elgato-Public/security/advisories/new)
under **Security > Report a vulnerability**. Remove personal data and
credentials before sharing reproduction steps.

The plugin reads a local Windows named pipe as the same Windows user as
BatteryBuddy. It does not send commands to BatteryBuddy or require administrator
privileges. Stream Deck's local WebSocket connection carries plugin UI/settings
events; it is not an HTTP server started by this plugin.

Incoming frames have bounded sizes, device counts and validated fields. Colours
must be six-digit hex values; the plugin generates its own icon rather than
loading images or URLs received over the pipe. A compromised process running as
the same user is outside the isolation boundary of this integration.

Ordinary bugs belong in the public repository's Issues. Download installers
from its Releases page and verify the provided SHA-256 checksum. A checksum is
not a digital signature. No Marketplace publication or certification is implied.
