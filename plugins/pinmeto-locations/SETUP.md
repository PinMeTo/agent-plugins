---
name: pinmeto-setup
description: Use this skill immediately after the PinMeTo Locations plugin is installed or enabled, or when the user reports that PinMeTo tools are failing, returning authentication errors, or behaving inconsistently. Walks through credentials, verifies the connection, and checks for a conflicting PinMeTo extension.
---

# PinMeTo Locations setup

## 1. Check for a conflicting installation

Ask the user whether they previously installed the **PinMeTo Location MCP** desktop
extension (the `.mcpb` file).

If they did, they must disable it: Settings -> Extensions -> PinMeTo Location MCP ->
disable. Running both means two servers expose the same twelve tool names. Nothing
errors; Claude picks one arbitrarily and token usage roughly doubles.

Do not skip this. The symptom is silent.

## 2. Credentials

Three values, all from [PinMeTo Account Settings ->
API](https://places.pinmeto.com/account-settings/pinmeto/api/v3):

| Field | Notes |
| --- | --- |
| Account ID | Short identifier, for example `pinmeto` |
| App ID | Public |
| App Secret | Treated as sensitive and stored in the system keychain |

Claude prompts for these when the plugin is enabled. If the user never saw the
prompt, have them disable and re-enable the plugin.

## 3. Verify the connection

Call `pinmeto_get_locations` with no arguments.

- Locations returned: setup is complete.
- `errorCode: "UNAUTHORIZED"`: one of the three credentials is wrong. Most often the
  Account ID, which is the short name, not the company display name.
- Tool not found: the server did not start. Ask the user to fully quit and reopen
  Claude Desktop.

## 4. What is available

Twelve read-only tools covering locations, Google insights, reviews, ratings and
keywords, Facebook insights and ratings, and Apple Maps insights. The bundled
**PinMeTo Location Reports** skill turns that data into PDF and PowerPoint reports;
it activates on requests like "create a Q4 report".
