"use client";

import { useEffect, useState } from "react";

export function useProducts(ids) {
  const key = ids.join(",");
  const [state, setState] = useState({ key: null, products: [] });

  useEffect(() => {
    if (!key) return;
    let alive = true;
    fetch(`/api/catalog?ids=${encodeURIComponent(key)}`)
      .then((r) => r.json())
      .then((products) => alive && setState({ key, products }))
      .catch(() => alive && setState({ key, products: [] }));
    return () => {
      alive = false;
    };
  }, [key]);

  return { products: key ? state.products : [], loading: Boolean(key) && state.key !== key };
}
