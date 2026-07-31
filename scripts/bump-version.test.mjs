import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextVersion } from './bump-version.mjs';

test('server major bump drives the plugin major', () => {
  assert.equal(
    nextVersion('4.3.2', { server: '4.1.0', skill: '1.2.0' }, { server: '5.0.0', skill: '1.2.0' }),
    '5.0.0'
  );
});

test('server minor bump bumps the plugin minor', () => {
  assert.equal(
    nextVersion('4.3.2', { server: '4.1.0', skill: '1.2.0' }, { server: '4.2.0', skill: '1.2.0' }),
    '4.4.0'
  );
});

test('skill minor bump bumps the plugin minor', () => {
  assert.equal(
    nextVersion('4.3.2', { server: '4.1.0', skill: '1.2.0' }, { server: '4.1.0', skill: '1.3.0' }),
    '4.4.0'
  );
});

test('patch on either component bumps the plugin patch', () => {
  assert.equal(
    nextVersion('4.3.2', { server: '4.1.0', skill: '1.2.0' }, { server: '4.1.1', skill: '1.2.0' }),
    '4.3.3'
  );
});

test('simultaneous minors collapse into one bump', () => {
  assert.equal(
    nextVersion('4.3.2', { server: '4.1.0', skill: '1.2.0' }, { server: '4.2.0', skill: '1.3.0' }),
    '4.4.0'
  );
});

test('no component change returns null', () => {
  assert.equal(
    nextVersion('4.3.2', { server: '4.1.0', skill: '1.2.0' }, { server: '4.1.0', skill: '1.2.0' }),
    null
  );
});

test('a server major reset takes precedence over a skill patch', () => {
  assert.equal(
    nextVersion('4.3.2', { server: '4.1.0', skill: '1.2.0' }, { server: '5.0.0', skill: '1.2.1' }),
    '5.0.0'
  );
});
