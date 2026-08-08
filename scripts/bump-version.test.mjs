import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextVersion, parseFlag } from './bump-version.mjs';

// before/after are skill-name -> version maps.
const REPORTS = 'pinmeto-location-reports';

test('single skill patch bump increments plugin patch', () => {
  assert.equal(nextVersion('4.1.0', { [REPORTS]: '1.2.0' }, { [REPORTS]: '1.2.1' }), '4.1.1');
});

test('single skill minor bump increments plugin minor and zeroes patch', () => {
  assert.equal(nextVersion('4.1.0', { [REPORTS]: '1.2.0' }, { [REPORTS]: '1.3.0' }), '4.2.0');
});

test('single skill major bump increments plugin major and zeroes minor/patch', () => {
  assert.equal(nextVersion('4.1.0', { [REPORTS]: '1.2.0' }, { [REPORTS]: '2.0.0' }), '5.0.0');
});

test('no skill change returns null', () => {
  assert.equal(nextVersion('4.1.0', { [REPORTS]: '1.2.0' }, { [REPORTS]: '1.2.0' }), null);
});

test('across multiple skills, the strongest bump wins (major beats patch)', () => {
  const before = { [REPORTS]: '1.2.0', 'pinmeto-web-presence': '0.3.0' };
  const after = { [REPORTS]: '1.2.1', 'pinmeto-web-presence': '1.0.0' };
  assert.equal(nextVersion('4.2.0', before, after), '5.0.0');
});

test('across multiple skills, a lone minor on one skill is a plugin minor', () => {
  const before = { [REPORTS]: '1.2.0', 'pinmeto-web-presence': '0.3.0' };
  const after = { [REPORTS]: '1.2.0', 'pinmeto-web-presence': '0.4.0' };
  assert.equal(nextVersion('4.2.0', before, after), '4.3.0');
});

test('a brand-new skill in after (not in before) does not drive a bump on its own', () => {
  const before = { [REPORTS]: '1.2.0' };
  const after = { [REPORTS]: '1.2.0', 'pinmeto-web-presence': '0.1.0' };
  assert.equal(nextVersion('4.1.0', before, after), null);
});

test('skill downgrade throws unless allowed, then yields a patch bump', () => {
  assert.throws(() => nextVersion('5.0.0', { [REPORTS]: '1.3.0' }, { [REPORTS]: '1.2.0' }), /older than/);
  assert.equal(nextVersion('5.0.0', { [REPORTS]: '1.3.0' }, { [REPORTS]: '1.2.0' }, true), '5.0.1');
});

test('parseFlag reads --flag value and --flag=value, null when absent', () => {
  assert.equal(parseFlag(['--skill', REPORTS], '--skill'), REPORTS);
  assert.equal(parseFlag(['--version=1.2.0'], '--version'), '1.2.0');
  assert.equal(parseFlag(['--other', 'x'], '--skill'), null);
});

test('parseFlag throws on a dangling flag', () => {
  assert.throws(() => parseFlag(['--version', '--allow-downgrade'], '--version'), /requires a value/);
});
