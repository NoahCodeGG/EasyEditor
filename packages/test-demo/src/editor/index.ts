import { createEasyEditor } from '@easy-editor/core'

const easyEditor = createEasyEditor()
console.log('🚀 ~ easyEditor:', easyEditor)

// need param
easyEditor.init({
  constants: {
    a: 1,
  },
  lifeCycles: {
    init: () => {
      console.log('init')
    },
    destroy: () => {
      console.log('destroy')
    },
  },
  utils: [
    {
      name: 'test',
      type: 'function',
      content: () => {
        console.log('test')
      },
    },
  ],
  // hotkeys: [],
  // components: {
  //   'text-block': TextBlock,
  // },
})

const designer = await easyEditor.onceGot('designer')
const project = await easyEditor.onceGot('project')
const setterManager = await easyEditor.onceGot('setterManager')
const componentMetaManager = await easyEditor.onceGot('componentMetaManager')
const simulator = await easyEditor.onceGot('simulator')
console.log('🚀 ~ designer:', designer)
console.log('🚀 ~ project:', project)
console.log('🚀 ~ setterManager:', setterManager)
console.log('🚀 ~ componentMetaManager:', componentMetaManager)
console.log('🚀 ~ simulator:', simulator)
