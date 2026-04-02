/**
 * Lightweight cross-page sync event bus.
 * When any module logs data (water, meal, exercise, weight, checklist),
 * it fires an event that other pages listen to and re-fetch.
 */

type SyncEvent =
  | "water:updated"
  | "meal:logged"
  | "exercise:logged"
  | "weight:logged"
  | "checklist:updated"
  | "health:updated"
  | "sync:all";

type Listener = () => void;

const listeners = new Map<SyncEvent, Set<Listener>>();

export function onSync(event: SyncEvent, fn: Listener): () => void {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event)!.add(fn);
  // Return unsubscribe function
  return () => { listeners.get(event)?.delete(fn); };
}

export function emitSync(event: SyncEvent) {
  listeners.get(event)?.forEach((fn) => fn());
  // "sync:all" listeners always fire on any event
  if (event !== "sync:all") {
    listeners.get("sync:all")?.forEach((fn) => fn());
  }
}
