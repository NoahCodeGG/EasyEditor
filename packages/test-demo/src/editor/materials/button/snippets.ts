import type { Snippet } from '@easy-editor/core'

const snippets: Snippet[] = [
  {
    title: '主按钮',
    // screenshot: require('./__screenshots__/button-1.png'),
    schema: {
      componentName: 'Button',
      props: {
        type: 'primary',
        children: '主按钮',
      },
    },
  },
  {
    title: '次按钮',
    // screenshot: require('./__screenshots__/button-1.png'),
    schema: {
      componentName: 'Button',
      props: {
        type: 'default',
        children: '次按钮',
      },
    },
  },
]

export default snippets
