import { useState, useCallback } from "react";

// Wraps an async API call with busy + last-result state so pages can show
// spinners and inline error/success feedback without repeating boilerplate.
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const run = useCallback(async (fn) => {
    setBusy(true);
    try {
      const res = await fn();
      setResult(res);
      return res;
    } finally {
      setBusy(false);
    }
  }, []);

  return { busy, result, setResult, run };
}
