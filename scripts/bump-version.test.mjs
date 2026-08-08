import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextVersion, parseFlag } from './bump-version.mjs';

test('skill patch bump increments plugin patch', () => {
  assert.equal(nextVersion('4.0.1', { skill: '1.2.0' }, { skill: '1.2.1' }), '4.0.2');
});

test('skill minor bump increments plugin minor and zeroes patch', () => {
  assert.equal(nextVersion('4.0.1', { skill: '1.2.0' }, { skill: '1.3.0' }), '4.1.0');
});

test('skill major bump increments plugin major and zeroes minor/patch', () => {
  assert.equal(nextVersion('4.0.1', { skill: '1.2.0' }, { skill: '2.0.0' }), '5.0.0');
});

test('no skill change returns null', () => {
  assert.equal(nextVersion('4.0.1', { skill: '1.2.0' }, { skill: '1.2.0' }), null);
});

test('skill downgrade throws unless allowed', () => {
  assert.throws(() => nextVersion('5.0.0', { skill: '1.3.0' }, { skill: '1.2.0' }), /older than/);
  assert.equal(nextVersion('5.0.0', { skill: '1.3.0' }, { skill: '1.2.0' }, true), '5.0.1');
});

test('parseFlag reads --flag value and --flag=value', () => {
  assert.equal(parseFlag(['--skill', '1.2.0'], '--skill'), '1.2.0');
  assert.equal(parseFlag(['--skill=1.2.0'], '--skill'), '1.2.0');
  assert.equal(parseFlag(['--other', 'x'], '--skill'), null);
});

test('parseFlag throws on a dangling flag', () => {
  assert.throws(() => parseFlag(['--skill', '--allow-downgrade'], '--skill'), /requires a value/);
});
