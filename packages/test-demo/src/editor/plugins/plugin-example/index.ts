import type { Plugin } from '@easy-editor/core'

const ExamplePlugin: Plugin = ctx => {
  return {
    name: 'ExamplePlugin',
    deps: [],
    init() {
      ctx.logger.log('打个日志', ctx)
    },
  }
}

ExamplePlugin.pluginName = 'ExamplePlugin'

export default ExamplePlugin
