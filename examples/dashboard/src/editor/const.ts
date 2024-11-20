export const defaultDocumentSchema = {
  name: '未命名',
  rootNode: {
    componentName: 'RootContainer',
    props: {
      backgroundColor: '#ffffff',
    },
    $position: {
      x: 0,
      y: 0,
    },
    children: [
      {
        componentName: 'Button',
        props: {
          type: 'primary',
          text: '按钮',
        },
        $position: {
          x: 100,
          y: 100,
        },
      },
    ],
  },
}
