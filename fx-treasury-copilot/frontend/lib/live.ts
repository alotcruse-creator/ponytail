import { useEffect, useState } from "react";
import { api } from "./api";

// How often the UI re-pulls from the backend. The backend caches upstream
// calls, so frequent polling is cheap; it just keeps the screen current.
export const REFRESH_MS = 5000;

// Fetch `path` immediately, then re-fetch every `ms`. On a failed poll the
// previous data is kept (api() returns the exact `fallback` ref on error), so
// a transient hiccup never blanks the screen.
export function useLive<T>(path: string, fallback: T, ms: number = REFRESH_MS): {
  data: T; loading: boolean;
} {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = () =>
      api<T>(path, fallback).then((d) => {
        if (!alive) return;
        if (d !== fallback) setData(d); // keep prior data on error
        setLoading(false);
      });
    load();
    const id = setInterval(load, ms);
    return () => { alive = false; clearInterval(id); };
  }, [path, ms]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading };
}
