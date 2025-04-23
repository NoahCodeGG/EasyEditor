export const metadata = {
  componentName: 'CustomComponent',
  title: '自定义组件',
  description: '一个示例自定义组件，用于演示自定义组件开发和集成',
  icon: 'cube', // 图标名称
  category: 'custom', // 物料分类
  group: 'custom', // 物料分组
  tags: ['custom', 'example', 'demo'], // 标签
  priority: 1, // 在物料面板中的优先级

  // 配置信息
  configure: {
    // 支持的配置项
    supports: {
      style: true, // 支持样式设置
      events: ['onClick', 'onMouseEnter', 'onMouseLeave'], // 支持的事件
    },

    // 高级配置
    advanced: {
      initialChildren: [], // 初始子元素
    },
  },
}
