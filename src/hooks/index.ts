import { useEffect, useRef } from "react";

/**
 * 初始化时
 */
export function useInitialize(fn: Function) {
  const initialized_ref = useRef(false);
  useEffect(() => {
    // console.log("[hooks]useInitialize - useEffect", initialized_ref.current, fn);
    if (initialized_ref.current) {
      return;
    }
    initialized_ref.current = true;
    if (fn) {
      fn();
    }
  }, []);
}
export function useUnmounted(fn: Function) {
  useEffect(() => {
    return () => {
      fn();
    };
  }, []);
}

export function useLatestValue(v: unknown) {
  const ref = useRef(v);
  useEffect(() => {
    ref.current = v;
  }, [v]);
  return ref;
}

type Factory = () => unknown;
const _cache: Map<Factory, ReturnType<Factory>> = new Map();
export function useInstance<T extends Factory>(fn: T) {
  const ref = useRef<ReturnType<T>>(
    (() => {
      if (_cache.get(fn)) {
        const r = _cache.get(fn) as ReturnType<T>;
        return r;
      }
      const resp = fn();
      _cache.set(fn, resp);
      return resp as ReturnType<T>;
    })()
  );
  useEffect(() => {
    return () => {
      _cache.delete(fn);
    };
  }, []);
  return ref.current;
}
