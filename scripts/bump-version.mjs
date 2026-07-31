#!/usr/bin/env node
/**
 * Derives the plugin version from the two vendored component versions.
 *
 * Rule:
 *   major - tracks the server major only. Server majors are what break the skill,
 *           so the plugin major tells a user which server generation they are on.
 *   minor - either component had a minor release.
 *   patch - either component had a patch release.
 *
 * Simultaneous bumps collapse into one. Users install one thing and need one
 * number; components.json keeps the provenance.
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

/**
 * @param {string} currentPlugin  the plugin's current version
 * @param {{server: string, skill: string}} before  previously vendored versions
 * @param {{server: string, skill: string}} after   newly vendored versions
 * @param {boolean} [allowDowngrade]  skip the downgrade guard below
 * @returns {string|null} the next plugin version, or null if nothing changed
 */
export function nextVersion(currentPlugin, before, after, allowDowngrade = false) {
  const plugin = parse(currentPlugin);
  const [bs, as] = [parse(before.server), parse(after.server)];
  const [bk, ak] = [parse(before.skill), parse(after.skill)];

  // A backward version move is almost always a mistake (a force-moved tag, a typo
  // in a manual workflow_dispatch) rather than an intentional release. Refuse and
  // let the sync fail loudly instead of silently publishing a version that
  // misrepresents what shipped.
  if (!allowDowngrade) {
    if (compareVersions(as, bs) < 0) {
      throw new Error(
        `server version ${after.server} is older than the currently vendored ${before.server}. Refusing to sync a downgrade. Pass --allow-downgrade to override.`
      );
    }
    if (compareVersions(ak, bk) < 0) {
      throw new Error(
        `skill version ${after.skill} is older than the currently vendored ${before.skill}. Refusing to sync a downgrade. Pass --allow-downgrade to override.`
      );
    }
  }

  if (as.major !== bs.major) return `${as.major}.0.0`;

  // A skill major counts as a minor for the plugin: the plugin major is reserved for
  // the server generation, so a skill major cannot be represented as a plugin major.
  const minorBump = as.minor !== bs.minor || ak.major !== bk.major || ak.minor !== bk.minor;
  if (minorBump) return `${plugin.major}.${plugin.minor + 1}.0`;

  const patchBump = as.patch !== bs.patch || ak.patch !== bk.patch;
  if (patchBump) return `${plugin.major}.${plugin.minor}.${plugin.patch + 1}`;

  return null;
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

function main() {
  try {
    const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
    const pluginDir = join(rootDir, 'plugins', 'pinmeto-locations');
    const componentsPath = join(pluginDir, 'components.json');
    const pluginPath = join(pluginDir, '.claude-plugin', 'plugin.json');
    const marketplacePath = join(rootDir, '.claude-plugin', 'marketplace.json');

    const args = process.argv.slice(2);
    const allowDowngrade = args.includes('--allow-downgrade');

    const before = JSON.parse(readFileSync(componentsPath, 'utf-8'));
    const after = {
      server: parseFlag(args, '--server') ?? before.server,
      skill: parseFlag(args, '--skill') ?? before.skill
    };

    const pluginJson = JSON.parse(readFileSync(pluginPath, 'utf-8'));
    const next = nextVersion(pluginJson.version, before, after, allowDowngrade);

    if (next === null) {
      console.log('no change');
      return;
    }

    pluginJson.version = next;
    writeFileSync(pluginPath, JSON.stringify(pluginJson, null, 2) + '\n');
    writeFileSync(componentsPath, JSON.stringify(after, null, 2) + '\n');

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
