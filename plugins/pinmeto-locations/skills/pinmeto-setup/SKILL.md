---
name: pinmeto-setup
description: Use this skill immediately after installing or enabling the PinMeTo Locations and Web Presence plugin, or when the user reports that PinMeTo tools are failing, returning authentication errors, or behaving inconsistently. Walks through installing the .mcpb data connection, entering credentials, verifying the connection, and avoiding duplicate servers.
---

# PinMeTo plugin setup

## 1. Install the data connection (the Desktop Extension)

The location data comes from the **PinMeTo Location MCP** Desktop Extension
(`.mcpb`), not from this plugin. Download the latest `.mcpb` from
https://github.com/PinMeTo/pinmeto-location-mcp/releases, then double-click it (or
drag it into Claude Desktop -> Settings -> Extensions). Claude Desktop shows an
install dialog that prompts for three values.

In Claude Code, the same server runs from npm instead: see the "Claude Code" section
of https://github.com/PinMeTo/pinmeto-location-mcp#installation.

## 2. Credentials

All three come from [PinMeTo Account Settings ->
API](https://places.pinmeto.com/account-settings/pinmeto/api/v3):

| Field | Notes |
| --- | --- |
| Account ID | Short identifier, for example `pinmeto` (not the company display name) |
| App ID | Public |
| App Secret | Sensitive; stored in the system keychain |

## 3. Verify the connection

Call `pinmeto_get_locations({limit: 1, fields: ["storeId"]})`.

- A location returned: setup is complete.
- `errorCode: "UNAUTHORIZED"`: one of the three credentials is wrong, most often the
  Account ID.
- Tool not found: the extension did not start. Fully quit and reopen Claude Desktop.

## 4. Avoid running two servers

Only one PinMeTo server should be active. Duplicates expose the same twelve tool
names; Claude picks one silently and token usage roughly doubles. Check for:

- An **older PinMeTo Locations plugin** (version 4.0.1 or earlier) that still
  bundled its own server. Update it to the current skill-only plugin.
- A **second copy of the `.mcpb`** extension.

## 5. What is available

Twelve read-only tools covering locations, Google insights, reviews, ratings and
keywords, Facebook insights and ratings, and Apple Maps insights. Nothing in this
plugin writes to PinMeTo or to any listing.

Two skills build on that data:

- **PinMeTo Location Reports** turns it into PDF and PowerPoint reports. It activates
  on requests like "create a Q4 report".
- **PinMeTo Web Presence** scans the brand's website and its Google, Apple and Bing
  Maps listings against the PinMeTo data and produces a scored report. It activates
  on requests like "check our web presence for brand.com". It needs a browser tool
  for the map checks; without one it still runs the website checks and marks the
  rest as not measured.
