# PinMeTo Location Reports & Visibility

Create location performance reports and audit your visibility across search, maps, and AI
answers using your PinMeTo data.

Use these skills in Claude, ChatGPT, or Codex with the PinMeTo Location MCP data connection.
Installation and available tools depend on the host; see the instructions below.

## What you can do

**Location Reports.** Ask for a monthly, quarterly, half-year, or annual report and get a PDF
or PowerPoint in PinMeTo branding. It covers Google Business Profile, Facebook, and Apple Maps:
views, searches, direction requests, calls, ratings, review themes, and the keywords customers
use to find you, each compared with the previous period or the same period last year.

**Web Presence.** Ask for a presence scan of your website and you get one score out of 100, a
ranked list of what to fix, and a brief your developer can act on for each item. The scan reads
your store locator and location pages, looks up your listings on Google, Apple, and Bing Maps
the way a customer sees them, checks whether ChatGPT, Claude, Gemini, and Perplexity can quote
your own pages, and checks whether AI agents acting for a customer can use your site. Run it
again next month and the same report shows what moved.

Both compare the live web with the location data you manage in PinMeTo, since most findability
problems come down to the same fact being different in two places.

## What you need

- A PinMeTo account with API access. Your Account ID, App ID, and App Secret are under
  [Account Settings > API](https://places.pinmeto.com/account-settings/pinmeto/api/v3).
- A host that supports skills and the PinMeTo MCP connection, such as Claude Desktop,
  Claude Code, or Codex in the ChatGPT desktop app.
- For the Web Presence scan, a browser tool that can read map listings as a customer sees
  them. Without one, the scan runs the website checks and marks the map checks as not measured.

## Install

Two steps. The first installs the data connection, the second adds the skills.

### Claude Desktop

1. **Install the data connection.** Download the latest `.mcpb` file from the
   [PinMeTo Location MCP releases](https://github.com/PinMeTo/pinmeto-location-mcp/releases).
   Double-click it with Claude Desktop open (or drag it into Settings > Extensions) and enter
   your three credentials when asked.
2. **Add the plugin.** In Claude Desktop, open Customize > Plugins, click the plus sign and
   choose Add marketplace, enter `PinMeTo/agent-plugins`, then install
   **PinMeTo Location Reports & Visibility** from the PinMeTo marketplace.

While this repository is private, step 2 requires the Claude GitHub App to have access to it.

### Claude Code

1. Configure the server using the [PinMeTo Location MCP installation instructions](https://github.com/PinMeTo/pinmeto-location-mcp#installation).
2. Add the marketplace and install the plugin:

   ```text
   /plugin marketplace add PinMeTo/agent-plugins
   /plugin install pinmeto-locations@pinmeto
   ```

### ChatGPT and Codex

1. Configure the data connection using the [ChatGPT desktop app instructions](https://github.com/PinMeTo/pinmeto-location-mcp#chatgpt-desktop-app).
   This local connection runs in Codex in the desktop app. ChatGPT on the web requires a remote
   MCP connection; it cannot use this local server configuration.
2. Install the skills using the host-specific instructions in the
   [Location Reports](https://github.com/PinMeTo/pinmeto-location-reports-skill) and
   [Web Presence](https://github.com/PinMeTo/pinmeto-web-presence-skill) repositories.

The skills use a shared format. The data connection and browser tools must also be available
in the host where you run them.

### Check the connection

Ask your assistant: "Show me one of my locations." If it returns a location, the data connection
works. If you installed the bundled setup skill, ask it to "run PinMeTo setup" for help.

## Try asking

> Create a Q3 2026 report as PDF and PowerPoint

> Make an annual report for 2025 for our board meeting

> Check our web presence for brand.com

> Re-run the presence scan for brand.com and show me what changed since last month

## Good to know

Reports and scans are generated with AI from your PinMeTo data and public signals. They can
make mistakes, so verify a finding before you act on it. The Web Presence score points at where
visibility can improve; it is not a ranking PinMeTo guarantees.

Everything here is read-only. The plugin never changes your PinMeTo data or your listings.

## For developers

This repository is the **PinMeTo Plugins** marketplace. The plugin identifier stays
`pinmeto-locations`, and the marketplace identifier stays `pinmeto`, so existing command
names remain stable. The `.claude-plugin/` directories contain the Claude-compatible manifests;
the skills themselves use the shared skill format.

The plugin ships three skills under `plugins/pinmeto-locations/skills/`:

| Skill | Source | Maintained |
| --- | --- | --- |
| `pinmeto-location-reports` | [pinmeto-location-reports-skill](https://github.com/PinMeTo/pinmeto-location-reports-skill) | Vendored by the sync workflow |
| `pinmeto-web-presence` | [pinmeto-web-presence-skill](https://github.com/PinMeTo/pinmeto-web-presence-skill) | Vendored by the sync workflow |
| `pinmeto-setup` | This repository | Hand-authored |

`components.json` is the skill registry: each entry maps a skill name to its source `repo` and
the currently vendored `version`. Every registered skill's directory is generated by
`.github/workflows/sync.yml` from that skill's released `.skill` artifact and must not be
hand-edited. Edits belong in the skill repository; a release there triggers the sync.

The plugin version is derived from the registry. On each sync it follows the strongest bump
across all vendored skills (a skill major means a plugin major, minor means minor, patch means
patch). Adding or removing a skill from the registry is a manual edit carrying its own plugin
bump.

The twelve read-only MCP tools the skills call come from the
[PinMeTo Location MCP](https://github.com/PinMeTo/pinmeto-location-mcp) server, version 4.0.0
or later, installed separately.

## License

Proprietary. Copyright PinMeTo AB. Use is restricted to authorized users of PinMeTo's services;
see [LICENSE](LICENSE).
