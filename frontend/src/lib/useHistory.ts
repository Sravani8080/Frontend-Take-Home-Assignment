import { useCallback, useRef, useState } from "react";

export interface HistorySnapshot<T> {
  state: T;
}

export interface UseHistoryReturn<T> {
  current: T;
  set: (value: T) => void;
  replace: (value: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const MAX_HISTORY = 80;

/**
 * Generic undo/redo hook.
 * `set()` pushes a new state onto the stack (records an undoable action).
 * `replace()` overwrites the current entry without creating a new history step
 *   — useful for high-frequency updates like dragging.
 */
export function useHistory<T>(initial: T): UseHistoryReturn<T> {
  const [current, setCurrent] = useState<T>(initial);
  const pastRef = useRef<T[]>([]);
  const futureRef = useRef<T[]>([]);

  const set = useCallback((value: T) => {
    setCurrent((prev) => {
      pastRef.current = [...pastRef.current, prev].slice(-MAX_HISTORY);
      futureRef.current = [];
      return value;
    });
  }, []);

  const replace = useCallback((value: T) => {
    setCurrent(value);
  }, []);

  const undo = useCallback(() => {
    setCurrent((prev) => {
      if (pastRef.current.length === 0) return prev;
      const previous = pastRef.current[pastRef.current.length - 1];
      pastRef.current = pastRef.current.slice(0, -1);
      futureRef.current = [prev, ...futureRef.current];
      return previous;
    });
  }, []);

  const redo = useCallback(() => {
    setCurrent((prev) => {
      if (futureRef.current.length === 0) return prev;
      const next = futureRef.current[0];
      pastRef.current = [...pastRef.current, prev];
      futureRef.current = futureRef.current.slice(1);
      return next;
    });
  }, []);

  return {
    current,
    set,
    replace,
    undo,
    redo,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
  };
}
