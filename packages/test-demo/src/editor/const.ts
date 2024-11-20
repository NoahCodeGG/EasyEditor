export const defaultDocumentSchema = {
  name: '未命名',
  rootNode: {
    componentName: 'RootContainer',
    props: {
      backgroundColor: '#ffffff',
    },
    children: [
      {
        componentName: 'Button',
        props: {
          type: 'primary',
          text: '按钮',
        },
      },
    ],
  },
}
