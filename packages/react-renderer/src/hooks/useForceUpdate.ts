import { useCallback, useState } from 'react'

export const useForceUpdate = () => {
  const [_, setT] = useState(false)
  const forceUpdate = useCallback(() => {
    setT(v => !v)
  }, [])

  return forceUpdate
}
