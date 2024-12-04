import type { Node, SetterManager } from '@easy-editor/core'
import { createContext, useContext } from 'react'

export interface RendererContext {
  setterManager: SetterManager

  node: Node

  [extra: string]: any
}

const RendererContext = createContext<RendererContext>({} as RendererContext)

export const RendererContextProvider = RendererContext.Provider

export const useRendererContext = () => {
  try {
    return useContext(RendererContext)
  } catch (error) {
    console.warn('useRendererContext must be used within a RendererContextProvider')
  }
  return {} as RendererContext
}
