---
name: pinmeto-setup
description: Use this skill immediately after installing or enabling the PinMeTo Locations plugin, or when the user reports that PinMeTo tools are failing, returning authentication errors, or behaving inconsistently. Walks through installing the .mcpb data connection, entering credentials, verifying the connection, and avoiding duplicate servers.
---

# PinMeTo Locations setup

## 1. Install the data connection (the Desktop Extension)

The location data comes from the **PinMeTo Location MCP** Desktop Extension
(`.mcpb`), not from this plugin. Download the latest `.mcpb` from
https://github.com/PinMeTo/pinmeto-location-mcp/releases, then double-click it (or
drag it into Claude Desktop -> Settings -> Extensions). Claude Desktop shows an
install dialog that prompts for three values.

## 2. Credentials

All three come from [PinMeTo Account Settings ->
API](https://places.pinmeto.com/account-settings/pinmeto/api/v3):

| Field | Notes |
| --- | --- |
| Account ID | Short identifier, for example `pinmeto` (not the company display name) |
| App ID | Public |
| App Secret | Sensitive; stored in the system keychain |

## 3. Verify the connection

Call `pinmeto_get_locations` with no arguments.

- Locations returned: setup is complete.
- `errorCode: "UNAUTHORIZED"`: one of the three credentials is wrong, most often the
  Account ID.
- Tool not found: the extension did not start. Fully quit and reopen Claude Desktop.

## 4. Avoid running two servers

Only one PinMeTo server should be active. Duplicates expose the same twelve tool
names; Claude picks one silently and token usage roughly doubles. Check for:

- An **older PinMeTo Locations plugin** (version 4.0.1 or earlier) that still
  bundled its own server -- update it to the current skill-only plugin.
- A **second copy of the `.mcpb`** extension.

## 5. What is available

Twelve read-only tools covering locations, Google insights, reviews, ratings and
keywords, Facebook insights and ratings, and Apple Maps insights. This plugin's
**PinMeTo Location Reports** skill turns that data into PDF and PowerPoint reports;
it activates on requests like "create a Q4 report".
