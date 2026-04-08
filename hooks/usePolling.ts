import { useEffect, useRef } from 'react'

export function usePolling(callback: () => void, interval: number, active = true) {
  const savedCallback = useRef(callback)
  useEffect(() => { savedCallback.current = callback }, [callback])
  useEffect(() => {
    if (!active) return
    savedCallback.current()
    const id = setInterval(() => savedCallback.current(), interval)
    return () => clearInterval(id)
  }, [interval, active])
}
