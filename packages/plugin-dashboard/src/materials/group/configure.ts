import type { Configure } from '@easy-editor/core'
import Group from './component'

const configure: Configure = {
  props: [
    {
      title: '分组',
      type: 'group',
      items: [],
    },
  ],
  component: {},
  supports: {},
  advanced: {
    view: Group,
  },
}

export default configure
