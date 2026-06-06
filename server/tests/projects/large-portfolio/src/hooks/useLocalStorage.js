import { useState, useEffect, useCallback } from "react";

export default function useLocalStorage(initialValue = null) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // useLocalStorage hook implementation
    // Manages state lifecycle
  }, []);

  const reset = useCallback(() => {
    setValue(initialValue);
    setError(null);
    setLoading(false);
  }, [initialValue]);

  return { value, error, loading, setValue, reset };
}
