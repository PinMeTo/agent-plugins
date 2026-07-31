import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextVersion, parseFlag } from './bump-version.mjs';

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

test('skill major counts as a plugin minor, not a plugin major', () => {
  assert.equal(
    nextVersion('4.0.0', { server: '4.0.0', skill: '1.2.0' }, { server: '4.0.0', skill: '2.0.0' }),
    '4.1.0'
  );
});

test('a server downgrade is refused', () => {
  assert.throws(
    () => nextVersion('4.3.2', { server: '4.2.0', skill: '1.2.0' }, { server: '4.1.0', skill: '1.2.0' }),
    Error
  );
});

test('a skill downgrade is refused', () => {
  assert.throws(
    () => nextVersion('4.3.2', { server: '4.1.0', skill: '1.3.0' }, { server: '4.1.0', skill: '1.2.0' }),
    Error
  );
});

test('the downgrade error names the component and both versions', () => {
  assert.throws(
    () => nextVersion('4.3.2', { server: '4.2.0', skill: '1.2.0' }, { server: '4.1.0', skill: '1.2.0' }),
    {
      message:
        'server version 4.1.0 is older than the currently vendored 4.2.0. Refusing to sync a downgrade. Pass --allow-downgrade to override.'
    }
  );
});

test('allowDowngrade bypasses the guard and returns a version', () => {
  assert.equal(
    nextVersion('4.1.0', { server: '4.2.0', skill: '1.2.0' }, { server: '4.1.0', skill: '1.2.0' }, true),
    '4.2.0'
  );
});

test('equal versions are not treated as a downgrade', () => {
  assert.equal(
    nextVersion('4.3.2', { server: '4.1.0', skill: '1.2.0' }, { server: '4.1.0', skill: '1.2.0' }),
    null
  );
});

test('parseFlag throws when a flag is the last argument with no value', () => {
  assert.throws(() => parseFlag(['--server'], '--server'), {
    message: '--server requires a value'
  });
});

test('parseFlag throws when a flag is immediately followed by another flag', () => {
  assert.throws(() => parseFlag(['--server', '--skill', '1.2.0'], '--server'), {
    message: '--server requires a value'
  });
});

test('parseFlag accepts the --flag=value form', () => {
  assert.equal(parseFlag(['--server=4.1.0'], '--server'), '4.1.0');
});

test('parseFlag returns null when the flag is absent', () => {
  assert.equal(parseFlag(['--skill', '1.2.0'], '--server'), null);
});
