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

/**
 * @param {string} currentPlugin  the plugin's current version
 * @param {{server: string, skill: string}} before  previously vendored versions
 * @param {{server: string, skill: string}} after   newly vendored versions
 * @returns {string|null} the next plugin version, or null if nothing changed
 */
export function nextVersion(currentPlugin, before, after) {
  const plugin = parse(currentPlugin);
  const [bs, as] = [parse(before.server), parse(after.server)];
  const [bk, ak] = [parse(before.skill), parse(after.skill)];

  if (as.major !== bs.major) return `${as.major}.0.0`;

  const minorBump = as.minor !== bs.minor || ak.major !== bk.major || ak.minor !== bk.minor;
  if (minorBump) return `${plugin.major}.${plugin.minor + 1}.0`;

  const patchBump = as.patch !== bs.patch || ak.patch !== bk.patch;
  if (patchBump) return `${plugin.major}.${plugin.minor}.${plugin.patch + 1}`;

  return null;
}

// A skill major counts as a minor for the plugin: the plugin major is reserved for
// the server generation, so a skill major cannot be represented as a plugin major.

function main() {
  const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
  const pluginDir = join(rootDir, 'plugins', 'pinmeto-locations');
  const componentsPath = join(pluginDir, 'components.json');
  const pluginPath = join(pluginDir, '.claude-plugin', 'plugin.json');
  const marketplacePath = join(rootDir, '.claude-plugin', 'marketplace.json');

  const args = process.argv.slice(2);
  const argOf = flag => {
    const i = args.indexOf(flag);
    return i === -1 ? null : args[i + 1];
  };

  const before = JSON.parse(readFileSync(componentsPath, 'utf-8'));
  const after = {
    server: argOf('--server') ?? before.server,
    skill: argOf('--skill') ?? before.skill
  };

  const pluginJson = JSON.parse(readFileSync(pluginPath, 'utf-8'));
  const next = nextVersion(pluginJson.version, before, after);

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
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
