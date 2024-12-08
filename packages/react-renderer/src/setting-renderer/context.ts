import type { Editor } from '@easy-editor/core'
import { createContext, use } from 'react'

export interface SettingRendererContext {
  editor: Editor

  // setterManager: SetterManager

  // settingsManager: SettingsManager

  [extra: string]: any
}

export const SettingRendererContext = createContext<SettingRendererContext>({} as SettingRendererContext)

export const useSettingRendererContext = () => {
  try {
    return use(SettingRendererContext)
  } catch (error) {
    console.warn('useSettingRendererContext must be used within a SettingRendererContextProvider')
  }
  return {} as SettingRendererContext
}
