import { useEffect, useRef, useState } from 'react'

interface Options {
  once?: boolean
  threshold?: number
  rootMargin?: string
}

export function useInView<T extends HTMLElement = HTMLDivElement>({
  once = true,
  threshold = 0.15,
  rootMargin = '0px 0px -40px 0px',
}: Options = {}) {
  const ref = useRef<T | null>(null)
  const supportsObserver =
    typeof window !== 'undefined' && 'IntersectionObserver' in window
  const [inView, setInView] = useState(() => !supportsObserver)

  useEffect(() => {
    const node = ref.current
    if (!node || !supportsObserver) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (once) observer.disconnect()
        } else if (!once) {
          setInView(false)
        }
      },
      { threshold, rootMargin },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [once, threshold, rootMargin, supportsObserver])

  return { ref, inView }
}
