export const defaultDocumentSchema = {
  name: '未命名',
  rootNode: {
    componentName: 'RootContainer',
    props: {
      backgroundColor: '#ffffff',
    },
    $dashboard: {
      rect: {
        x: 0,
        y: 0,
      },
    },
    children: [
      {
        componentName: 'Button',
        props: {
          type: 'primary',
          text: '按钮',
        },
        $dashboard: {
          rect: {
            x: 100,
            y: 100,
            width: 50,
            height: 30,
          },
        },
      },
      {
        componentName: 'Group',
        isGroup: true,
        children: [
          {
            componentName: 'Button',
            props: {
              type: 'primary',
              text: '按钮 in Group',
            },
            $dashboard: {
              rect: {
                x: 0,
                y: 0,
                width: 70,
                height: 70,
              },
            },
          },
          {
            componentName: 'Button',
            props: {
              type: 'primary',
              text: '按钮222 in Group',
            },
            $dashboard: {
              rect: {
                x: 100,
                y: 50,
                width: 60,
                height: 50,
              },
            },
          },
        ],
        $dashboard: {
          rect: {
            x: 200,
            y: 200,
          },
        },
      },
    ],
  },
}
