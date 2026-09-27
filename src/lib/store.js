"use client";

import { useSyncExternalStore } from "react";

const EMPTY = [];

function createStore(key) {
  const listeners = new Set();
  const cache = { raw: null, value: EMPTY, memoryOnly: false };

  function read() {
    if (typeof window === "undefined") return EMPTY;
    if (cache.memoryOnly) return cache.value;
    let raw = null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      cache.memoryOnly = true;
      return cache.value;
    }
    if (raw !== cache.raw) {
      cache.raw = raw;
      try {
        cache.value = raw ? JSON.parse(raw) : EMPTY;
      } catch {
        cache.value = EMPTY;
      }
    }
    return cache.value;
  }

  function write(value) {
    const raw = JSON.stringify(value);
    cache.value = value;
    cache.raw = raw;
    try {
      window.localStorage.setItem(key, raw);
    } catch {
      cache.memoryOnly = true;
    }
    listeners.forEach((l) => l());
  }

  function subscribe(cb) {
    listeners.add(cb);
    const onStorage = (e) => {
      if (e.key === key) cb();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(cb);
      window.removeEventListener("storage", onStorage);
    };
  }

  return { read, write, subscribe };
}

const cartStore = createStore("m3d_cart");
const favStore = createStore("m3d_fav");
const recentStore = createStore("m3d_recent");

export function toast(message) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("m3d-toast", { detail: message }));
}

export const cartKey = (i) => `${i.id}|${i.color || ""}`;

export function useCart() {
  const items = useSyncExternalStore(cartStore.subscribe, cartStore.read, () => EMPTY);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return {
    items,
    count,
    add(id, qty = 1, color = null) {
      const cur = cartStore.read();
      const key = cartKey({ id, color });
      const found = cur.find((i) => cartKey(i) === key);
      cartStore.write(
        found
          ? cur.map((i) => (cartKey(i) === key ? { ...i, qty: Math.min(99, i.qty + qty) } : i))
          : [...cur, { id, qty, ...(color ? { color } : {}) }]
      );
    },
    setQty(key, qty) {
      const cur = cartStore.read();
      cartStore.write(
        qty <= 0
          ? cur.filter((i) => cartKey(i) !== key)
          : cur.map((i) => (cartKey(i) === key ? { ...i, qty: Math.min(99, qty) } : i))
      );
    },
    remove(key) {
      cartStore.write(cartStore.read().filter((i) => cartKey(i) !== key));
    },
    clear() {
      cartStore.write([]);
    },
  };
}

export function useFavorites() {
  const ids = useSyncExternalStore(favStore.subscribe, favStore.read, () => EMPTY);

  return {
    ids,
    has: (id) => ids.includes(id),
    toggle(id) {
      const cur = favStore.read();
      const on = cur.includes(id);
      favStore.write(on ? cur.filter((x) => x !== id) : [...cur, id]);
      toast(on ? "Sevimlilardan olib tashlandi" : "Sevimlilarga qo'shildi");
    },
  };
}

export function useRecent() {
  const ids = useSyncExternalStore(recentStore.subscribe, recentStore.read, () => EMPTY);
  return {
    ids,
    push(id) {
      const cur = recentStore.read();
      if (cur[0] === id) return;
      recentStore.write([id, ...cur.filter((x) => x !== id)].slice(0, 12));
    },
  };
}
