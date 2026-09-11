import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { debounce } from '../debounce'

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('defers the call until the wait window elapses', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 300)
    debounced('a')
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(299)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('a')
  })

  it('collapses rapid calls into a single invocation with the last arguments', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 300)
    debounced(1)
    vi.advanceTimersByTime(100)
    debounced(2)
    vi.advanceTimersByTime(100)
    debounced(3)
    vi.advanceTimersByTime(299)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith(3)
  })

  it('cancel() discards a pending invocation', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 300)
    debounced()
    debounced.cancel()
    vi.advanceTimersByTime(5000)
    expect(fn).not.toHaveBeenCalled()
  })

  it('flush() runs a pending invocation immediately', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 300)
    debounced('x')
    expect(fn).not.toHaveBeenCalled()
    debounced.flush()
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('x')
  })

  it('isPending tracks a scheduled call', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 300)
    expect(debounced.isPending()).toBe(false)
    debounced()
    expect(debounced.isPending()).toBe(true)
    debounced.flush()
    expect(debounced.isPending()).toBe(false)
  })
})