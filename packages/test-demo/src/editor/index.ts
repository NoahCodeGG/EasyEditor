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
console.log('🚀 ~ plugins:', plugins)
console.log('🚀 ~ setterMap:', setterMap)
console.log('🚀 ~ componentMap:', componentMap)
console.log('🚀 ~ componentMetaMap:', componentMetaMap)

const easyEditor = createEasyEditor()
console.log('🚀 ~ easyEditor:', easyEditor)

// need param
easyEditor.init({
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
  // hotkeys: [],
})

const designer = await easyEditor.onceGot<Designer>('designer')
const project = await easyEditor.onceGot<Project>('project')
const setterManager = await easyEditor.onceGot<SetterManager>('setterManager')
const componentMetaManager = await easyEditor.onceGot<ComponentMetaManager>('componentMetaManager')
const simulator = await easyEditor.onceGot<Simulator>('simulator')
console.log('🚀 ~ designer:', designer)
console.log('🚀 ~ project:', project)
console.log('🚀 ~ setterManager:', setterManager)
console.log('🚀 ~ componentMetaManager:', componentMetaManager)
console.log('🚀 ~ simulator:', simulator)

console.log('--------------------------------')
console.log('setters', setterManager.settersMap)
console.log('components', simulator.components)
console.log('componentMetas', componentMetaManager.componentMetasMap)
