import {
  type Component,
  type ComponentMetaManager,
  type ComponentMetadata,
  type Designer,
  type Project,
  type Setter,
  type SetterManager,
  type Simulator,
  createEasyEditor,
} from '@easy-editor/core'
import { formatMapFromESModule } from './utils'

const plugins = (await import('./plugins')).default
const setterMap = await import('./setters')
const componentMap = await import('./materials/component')
const componentMetaMap = await import('./materials/meta')

export const editor = createEasyEditor({
  lifeCycles: {
    init: () => {
      console.log('init')
    },
    destroy: () => {
      console.log('destroy')
    },
  },
  plugins,
  setters: formatMapFromESModule<Setter>(setterMap),
  components: formatMapFromESModule<Component>(componentMap),
  componentMetas: formatMapFromESModule<ComponentMetadata>(componentMetaMap),
})
console.log('🚀 ~ easyEditor:', editor)

const designer = await editor.onceGot<Designer>('designer')
const project = await editor.onceGot<Project>('project')
const setterManager = await editor.onceGot<SetterManager>('setterManager')
const componentMetaManager = await editor.onceGot<ComponentMetaManager>('componentMetaManager')
const simulator = await editor.onceGot<Simulator>('simulator')

console.log('--------------------------------')
console.log('setters', setterManager.settersMap)
console.log('components', simulator.components)
console.log('componentMetas', componentMetaManager.componentMetasMap)
