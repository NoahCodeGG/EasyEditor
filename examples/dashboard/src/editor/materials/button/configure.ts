import type { Configure } from '@easy-editor/core'

const configure: Configure = {
  props: [
    {
      type: 'group',
      title: '功能',
      setter: 'GroupSetter',
      items: [
        {
          type: 'field',
          name: 'text',
          title: '内容',
          setter: 'StringSetter',
        },
      ],
    },
  ],
  component: {},
  supports: {},
  advanced: {},
}

export default configure
