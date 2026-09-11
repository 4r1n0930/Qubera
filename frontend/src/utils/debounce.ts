/**
 * Debounce utilities for the quantum code conversion editing loop.
 * The pure `debounce` function is framework-agnostic and unit-testable;
 * `useDebouncedCallback` adapts it for React components that need to keep
 * closure access to the latest props/state via a ref.
 */

import { useEffect, useState } from 'react'

export interface DebouncedFunction<A extends unknown[]> {
  (...args: A): void
  cancel(): void
  flush(): void
  /** True while a timer is scheduled and no call has been released yet. */
  isPending(): boolean
}

export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  wait: number
): DebouncedFunction<A> {
  let timer: ReturnType<typeof setTimeout> | null = null
  let pendingArgs: A | null = null

  const invoke = () => {
    timer = null
    if (pendingArgs) {
      const args = pendingArgs
      pendingArgs = null
      fn(...args)
    }
  }

  const debounced = (...args: A) => {
    pendingArgs = args
    if (timer) clearTimeout(timer)
    timer = setTimeout(invoke, wait)
  }

  debounced.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = null
    pendingArgs = null
  }

  debounced.flush = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
      invoke()
    }
  }

  debounced.isPending = () => timer !== null

  return debounced as DebouncedFunction<A>
}

export function useDebouncedCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  wait: number
): DebouncedFunction<A> {
  // The debounced instance is created once and captures `fn`. Callers should
  // pass a stable callback (e.g. `useCallback`) whose latest state it reads
  // from refs when invoked — that keeps the pending-timer window honest
  // without stale-closure or ref-access hazards.
  const [debounced] = useState<DebouncedFunction<A>>(() => debounce(fn, wait))

  useEffect(() => {
    const instance = debounced
    return () => {
      instance.cancel()
    }
  }, [debounced])

  return debounced
}