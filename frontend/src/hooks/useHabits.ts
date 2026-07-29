import { useCallback, useEffect, useRef, useState } from 'react';

export type Habit = {
  id: string;
  name: string;
  icon: string;
  color: string;
  order?: number;
};

export type Entry = {
  id?: string;
  habit_id: string;
  date: string; // YYYY-MM-DD
  done: boolean;
  note?: string;
};

type EntriesMap = Record<string, Entry>; // key `${habit_id}|${date}` -> Entry

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const entriesCache = useRef<Record<string, EntriesMap>>({});
  const [, setTick] = useState(0);

  // Load habits once
  const loadHabits = useCallback(async () => {
    try {
      const res = await fetch('/api/habits');
      if (!res.ok) throw new Error(`failed to load habits: ${res.status}`);
      const json = await res.json();
      setHabits(json || []);
    } catch (err) {
      console.error('useHabits: loadHabits error', err);
    }
  }, []);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const entriesForMonth = useCallback((month: string): Entry[] => {
    const map = entriesCache.current[month] || {};
    return Object.values(map);
  }, []);

  const ensureMonthLoaded = useCallback(async (month: string) => {
    if (entriesCache.current[month]) return;
    try {
      const res = await fetch(`/api/entries?month=${encodeURIComponent(month)}`);
      if (!res.ok) throw new Error(`failed to load entries: ${res.status}`);
      const json: Entry[] = await res.json();
      const map: EntriesMap = {};
      for (const e of json) {
        map[`${e.habit_id}|${e.date}`] = e;
      }
      entriesCache.current[month] = map;
      // trigger re-render for consumers
      setTick((t) => t + 1);
    } catch (err) {
      console.error('useHabits: ensureMonthLoaded error', err);
      entriesCache.current[month] = {};
      setTick((t) => t + 1);
    }
  }, []);

  const reloadMonth = useCallback(async (month: string) => {
    entriesCache.current[month] = undefined as any;
    await ensureMonthLoaded(month);
  }, [ensureMonthLoaded]);

  // Add a habit that was already created server-side (e.g. via HabitEditor's
  // own POST) to local state, so the table/calendar/legend pick it up
  // without a full reload.
  const addHabit = useCallback((habit: Habit) => {
    setHabits((prev) => [...prev, habit]);
  }, []);

  // Rename/update a habit's fields (name/icon/color/order). Optimistic with
  // rollback on failure.
  const updateHabit = useCallback(async (id: string, patch: Partial<Pick<Habit, 'name' | 'icon' | 'color' | 'order'>>) => {
    let previous: Habit | undefined;
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          previous = h;
          return { ...h, ...patch };
        }
        return h;
      }),
    );
    try {
      const res = await fetch(`/api/habits/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`update failed: ${res.status}`);
      const updated: Habit = await res.json();
      setHabits((prev) => prev.map((h) => (h.id === id ? updated : h)));
      return updated;
    } catch (err) {
      console.error('useHabits: updateHabit error', err);
      if (previous) {
        const prevHabit = previous;
        setHabits((prev) => prev.map((h) => (h.id === id ? prevHabit : h)));
      }
      throw err;
    }
  }, []);

  // Delete a habit (and its entries) server-side; optimistic removal with
  // rollback on failure.
  const removeHabit = useCallback(async (id: string) => {
    let previous: Habit | undefined;
    let previousIndex = -1;
    setHabits((prev) => {
      previousIndex = prev.findIndex((h) => h.id === id);
      if (previousIndex >= 0) previous = prev[previousIndex];
      return prev.filter((h) => h.id !== id);
    });
    try {
      const res = await fetch(`/api/habits/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error(`delete failed: ${res.status}`);
    } catch (err) {
      console.error('useHabits: removeHabit error', err);
      if (previous) {
        const prevHabit = previous;
        const idx = previousIndex;
        setHabits((prev) => {
          const copy = [...prev];
          copy.splice(idx < 0 ? copy.length : idx, 0, prevHabit);
          return copy;
        });
      }
      throw err;
    }
  }, []);

  const toggle = useCallback(async (habitId: string, date: string) => {
    const month = date.slice(0, 7);
    if (!entriesCache.current[month]) {
      await ensureMonthLoaded(month);
    }
    const key = `${habitId}|${date}`;
    const existing = entriesCache.current[month][key];

    if (existing && existing.done) {
      // optimistic remove: delete or mark done=false.
      const previous = existing;
      // mutate cache optimistically
      const newMap = { ...entriesCache.current[month] };
      delete newMap[key];
      entriesCache.current[month] = newMap;
      setTick((t) => t + 1);

      // If we have an id, call DELETE, otherwise call POST with done=false
      try {
        if (previous.id) {
          const res = await fetch(`/api/entries/${previous.id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('delete failed');
        } else {
          // fallback: set done=false via POST
          const res = await fetch('/api/entries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ habit_id: habitId, date, done: false }),
          });
          if (!res.ok) throw new Error('unset failed');
        }
      } catch (err) {
        console.error('useHabits: toggle(delete) error', err);
        // revert
        entriesCache.current[month] = { ...entriesCache.current[month], [key]: previous };
        setTick((t) => t + 1);
      }
    } else {
      // optimistic create
      const tmpId = `tmp-${Math.random().toString(36).slice(2)}`;
      const tmpEntry: Entry = { id: tmpId, habit_id: habitId, date, done: true };
      const newMap = { ...entriesCache.current[month], [key]: tmpEntry };
      entriesCache.current[month] = newMap;
      setTick((t) => t + 1);

      try {
        const res = await fetch('/api/entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ habit_id: habitId, date, done: true }),
        });
        if (!res.ok) throw new Error('create failed');
        const created: Entry = await res.json();
        // replace tmp id with real entry
        const replacedMap = { ...entriesCache.current[month] };
        replacedMap[key] = created;
        entriesCache.current[month] = replacedMap;
        setTick((t) => t + 1);
      } catch (err) {
        console.error('useHabits: toggle(create) error', err);
        // revert
        const reverted = { ...entriesCache.current[month] };
        delete reverted[key];
        entriesCache.current[month] = reverted;
        setTick((t) => t + 1);
      }
    }
  }, [ensureMonthLoaded]);

  return {
    habits,
    loadHabits,
    entriesForMonth,
    ensureMonthLoaded,
    toggle,
    reloadMonth,
    addHabit,
    updateHabit,
    removeHabit,
  } as const;
}

export default useHabits;
