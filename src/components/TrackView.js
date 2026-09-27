"use client";

import { useEffect } from "react";
import { useRecent } from "@/lib/store";

export default function TrackView({ id }) {
  const { push } = useRecent();
  useEffect(() => {
    push(id);
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
