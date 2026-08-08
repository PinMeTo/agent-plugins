#!/usr/bin/env node
/**
 * Derives the plugin version from the vendored skill version alone.
 *
 * Rule:
 *   major - skill had a major release (the plugin no longer bundles a server,
 *           so the plugin major simply follows the skill major bump forward).
 *   minor - skill had a minor release.
 *   patch - skill had a patch release.
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
 * Derives the plugin version from the vendored skill version alone.
 *
 * Rule:
 *   major - skill had a major release (the plugin no longer bundles a server,
 *           so the plugin major simply follows the skill major bump forward).
 *   minor - skill had a minor release.
 *   patch - skill had a patch release.
 *
 * @param {string} currentPlugin  the plugin's current version
 * @param {{skill: string}} before  previously vendored skill version
 * @param {{skill: string}} after   newly vendored skill version
 * @param {boolean} [allowDowngrade]  skip the downgrade guard
 * @returns {string|null} the next plugin version, or null if the skill did not move
 */
export function nextVersion(currentPlugin, before, after, allowDowngrade = false) {
  const plugin = parse(currentPlugin);
  const [bk, ak] = [parse(before.skill), parse(after.skill)];

  const isDowngrade = compareVersions(ak, bk) < 0;

  if (!allowDowngrade && isDowngrade) {
    throw new Error(
      `skill version ${after.skill} is older than the currently vendored ${before.skill}. Refusing to sync a downgrade. Pass --allow-downgrade to override.`
    );
  }

  // A downgrade always results in a patch bump
  if (isDowngrade) return `${plugin.major}.${plugin.minor}.${plugin.patch + 1}`;

  if (ak.major !== bk.major) return `${plugin.major + 1}.0.0`;
  if (ak.minor !== bk.minor) return `${plugin.major}.${plugin.minor + 1}.0`;
  if (ak.patch !== bk.patch) return `${plugin.major}.${plugin.minor}.${plugin.patch + 1}`;
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
    const after = { skill: parseFlag(args, '--skill') ?? before.skill };

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
