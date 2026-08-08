#!/usr/bin/env node
/**
 * Derives the plugin version from the vendored skill versions.
 *
 * components.json is the skill registry:
 *   { "skills": { "<name>": { "repo": "owner/name", "version": "x.y.z" } } }
 *
 * On each sync one skill's vendored version moves; the plugin version follows the
 * strongest bump across all changed skills (major > minor > patch). Adding or
 * removing a skill from the registry is a manual edit with its own plugin bump —
 * a skill that only appears in `after` does not drive a bump here.
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const parse = v => {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v);
  if (!m) throw new Error(`Not a semver version: ${v}`);
  return { major: +m[1], minor: +m[2], patch: +m[3] };
};

// Orders two parsed versions: negative if a is older than b, 0 if equal, positive
// if a is newer. Kept pure and next to parse() so the downgrade guard below is
// testable without touching the filesystem.
const compareVersions = (a, b) => a.major - b.major || a.minor - b.minor || a.patch - b.patch;

const RANK = { patch: 1, minor: 2, major: 3 };

/**
 * @param {string} currentPlugin  the plugin's current version
 * @param {Record<string,string>} before  skill name -> previously vendored version
 * @param {Record<string,string>} after   skill name -> newly vendored version
 * @param {boolean} [allowDowngrade]  skip the downgrade guard
 * @returns {string|null} the next plugin version, or null if no vendored skill moved
 */
export function nextVersion(currentPlugin, before, after, allowDowngrade = false) {
  const plugin = parse(currentPlugin);
  let severity = 0;

  for (const name of Object.keys(after)) {
    // A skill present only in `after` was just added to the registry. Its arrival
    // is a manual edit that carries its own plugin bump, so it does not drive one here.
    if (!(name in before)) continue;

    const b = parse(before[name]);
    const a = parse(after[name]);
    const isDowngrade = compareVersions(a, b) < 0;

    if (!allowDowngrade && isDowngrade) {
      throw new Error(
        `skill ${name} version ${after[name]} is older than the currently vendored ${before[name]}. Refusing to sync a downgrade. Pass --allow-downgrade to override.`
      );
    }

    // A downgrade always results in a patch bump.
    if (isDowngrade) severity = Math.max(severity, RANK.patch);
    else if (a.major !== b.major) severity = Math.max(severity, RANK.major);
    else if (a.minor !== b.minor) severity = Math.max(severity, RANK.minor);
    else if (a.patch !== b.patch) severity = Math.max(severity, RANK.patch);
  }

  if (severity === 0) return null;
  if (severity === RANK.major) return `${plugin.major + 1}.0.0`;
  if (severity === RANK.minor) return `${plugin.major}.${plugin.minor + 1}.0`;
  return `${plugin.major}.${plugin.minor}.${plugin.patch + 1}`;
}

/**
 * Reads a `--flag value` or `--flag=value` argument out of an argv-style array.
 * Pure and exported so the two silent-failure cases (a dangling flag with no
 * value, and the `--flag=value` form being ignored) are unit-testable without
 * invoking the CLI: a flag present with a missing or option-shaped value throws
 * rather than falling through to "not provided", which used to read as a
 * successful no-op.
 *
 * @param {string[]} args
 * @param {string} flag
 * @returns {string|null} the value, or null if the flag was not passed at all
 */
export function parseFlag(args, flag) {
  const eqPrefix = `${flag}=`;
  const eqArg = args.find(a => a.startsWith(eqPrefix));
  if (eqArg !== undefined) return eqArg.slice(eqPrefix.length);

  const i = args.indexOf(flag);
  if (i === -1) return null;

  const value = args[i + 1];
  if (value === undefined || value.startsWith('--')) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

// Extracts a { name: version } map from the components registry.
const versionsOf = components =>
  Object.fromEntries(Object.entries(components.skills).map(([name, meta]) => [name, meta.version]));

function main() {
  try {
    const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
    const pluginDir = join(rootDir, 'plugins', 'pinmeto-locations');
    const componentsPath = join(pluginDir, 'components.json');
    const pluginPath = join(pluginDir, '.claude-plugin', 'plugin.json');
    const marketplacePath = join(rootDir, '.claude-plugin', 'marketplace.json');

    const args = process.argv.slice(2);
    const allowDowngrade = args.includes('--allow-downgrade');

    const components = JSON.parse(readFileSync(componentsPath, 'utf-8'));
    const before = versionsOf(components);

    // Update exactly one registered skill's version. Both flags travel together;
    // a lone flag is a caller mistake, not a silent no-op.
    const skillName = parseFlag(args, '--skill');
    const skillVersion = parseFlag(args, '--version');
    const after = { ...before };
    if (skillName !== null || skillVersion !== null) {
      if (skillName === null || skillVersion === null) {
        throw new Error('--skill <name> and --version <x.y.z> must be passed together');
      }
      if (!(skillName in components.skills)) {
        throw new Error(
          `unknown skill '${skillName}'. Add it to components.json (with its repo) before syncing.`
        );
      }
      parse(skillVersion); // reject a malformed version before writing anything
      after[skillName] = skillVersion;
    }

    const pluginJson = JSON.parse(readFileSync(pluginPath, 'utf-8'));
    const next = nextVersion(pluginJson.version, before, after, allowDowngrade);

    if (next === null) {
      console.log('no change');
      return;
    }

    if (skillName !== null) components.skills[skillName].version = after[skillName];

    pluginJson.version = next;
    writeFileSync(pluginPath, JSON.stringify(pluginJson, null, 2) + '\n');
    writeFileSync(componentsPath, JSON.stringify(components, null, 2) + '\n');

    const marketplace = JSON.parse(readFileSync(marketplacePath, 'utf-8'));
    const entry = marketplace.plugins.find(p => p.name === 'pinmeto-locations');
    entry.version = next;
    writeFileSync(marketplacePath, JSON.stringify(marketplace, null, 2) + '\n');

    console.log(next);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
