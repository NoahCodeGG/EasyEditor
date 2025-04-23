declare module '@easy-editor/custom-component' {
  import type { FC } from 'react'

  export interface CustomComponentProps {
    title?: string
    content?: string
    theme?: 'light' | 'dark' | 'colorful'
    fontSize?: number
    showBorder?: boolean
    borderColor?: string
    refreshInterval?: number
  }

  export const Component: FC<CustomComponentProps>

  export interface PropDefinition {
    name: string
    title: string
    setter: string
    defaultValue?: any
    condition?: (target: { getProps: () => { getPropValue: (name: string) => any } }) => boolean
    extraProps?: {
      min?: number
      max?: number
      step?: number
      options?: Array<{ label: string; value: string }>
    }
  }

  export const propDefinitions: PropDefinition[]

  export const metadata: {
    componentName: string
    title: string
    description: string
    icon?: string
    category?: string
    group?: string
    tags?: string[]
    priority?: number
    configure?: {
      supports?: {
        style?: boolean
        events?: string[]
      }
      advanced?: {
        initialChildren?: any[]
      }
    }
  }

  export default {
    component: Component,
    metadata,
    props: propDefinitions,
  }
}
