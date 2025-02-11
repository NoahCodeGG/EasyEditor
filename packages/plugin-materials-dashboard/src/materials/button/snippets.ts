import type { Snippet } from '@easy-editor/core'

const snippets: Snippet[] = [
  {
    title: 'Primary Button',
    // screenshot: require('./__screenshots__/button-1.png'),
    schema: {
      componentName: 'Button',
      props: {
        text: 'Primary Button',
      },
      $dashboard: {
        rect: {
          width: 120,
          height: 80,
        },
      },
    },
  },
  {
    title: 'Destructive Button',
    schema: {
      componentName: 'Button',
      props: {
        variant: 'destructive',
        text: 'Destructive Button',
      },
      $dashboard: {
        rect: {
          width: 120,
          height: 80,
        },
      },
    },
  },
  {
    title: 'Outline Button',
    schema: {
      componentName: 'Button',
      props: {
        variant: 'outline',
        text: 'Outline Button',
      },
      $dashboard: {
        rect: {
          width: 120,
          height: 80,
        },
      },
    },
  },
]

export default snippets
