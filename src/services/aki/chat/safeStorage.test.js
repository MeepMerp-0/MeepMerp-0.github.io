import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SafeStorage } from './safeStorage.js';

// A Storage stand-in that refuses writes while `full` is set, as a browser does over its quota.
function setup() {
  const items = new Map();
  const area = {
    full: false,
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => {
      if (area.full) throw new Error('QuotaExceededError');
      items.set(key, value);
    },
    removeItem: (key) => items.delete(key),
  };
  return { area, store: new SafeStorage(() => area) };
}

test('a refused write is kept in memory and read ahead of the stored value', () => {
  const { area, store } = setup();
  store.set('k', 'stored');
  area.full = true;
  store.set('k', 'kept');
  assert.equal(store.get('k'), 'kept');
  assert.equal(area.getItem('k'), 'stored');
});

test('a successful write clears the memory copy', () => {
  const { area, store } = setup();
  area.full = true;
  store.set('k', 'kept');
  area.full = false;
  store.set('k', 'stored');
  area.setItem('k', 'changed in another tab');
  assert.equal(store.get('k'), 'changed in another tab');
});

test('a throwing or missing area falls back to memory', () => {
  for (const area of [() => { throw new Error('SecurityError'); }, () => null]) {
    const store = new SafeStorage(area);
    assert.equal(store.get('k'), null);
    store.set('k', 'kept');
    assert.equal(store.get('k'), 'kept');
    store.remove('k');
    assert.equal(store.get('k'), null);
  }
});

test('remove clears both the memory copy and the stored value', () => {
  const { area, store } = setup();
  store.set('k', 'stored');
  area.full = true;
  store.set('k', 'kept');
  store.remove('k');
  assert.equal(store.get('k'), null);
  assert.equal(area.getItem('k'), null);
});
