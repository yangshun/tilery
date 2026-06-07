'use client';

import { useCallback, useRef, useState } from 'react';

type LogEntry<T> = T & { id: number };

/**
 * Newest-first bounded event log. The returned `log` factory prepends a new
 * entry with an auto-incremented id, slicing the array to `maxEvents` so the
 * log never grows unbounded. `clear` resets the log to empty.
 */
export function useEventLog<T>(
  maxEvents: number,
): readonly [LogEntry<T>[], (data: T) => void, () => void] {
  const idRef = useRef(0);
  const [events, setEvents] = useState<LogEntry<T>[]>([]);

  const log = useCallback(
    (data: T) => {
      idRef.current += 1;
      const id = idRef.current;
      setEvents((current) =>
        [{ id, ...data }, ...current].slice(0, maxEvents),
      );
    },
    [maxEvents],
  );

  const clear = useCallback(() => setEvents([]), []);

  return [events, log, clear] as const;
}
