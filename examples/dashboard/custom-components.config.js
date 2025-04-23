// 自定义组件配置
module.exports = {
  // 组件列表
  components: [
    {
      // 组件ID
      id: 'CustomComponent',
      // 组件路径
      path:
        process.env.NODE_ENV === 'development'
          ? '../../packages/custom-component/dist/index.mjs'
          : './node_modules/@easy-editor/custom-component/dist/index.mjs',
      // 开发模式
      devMode: process.env.NODE_ENV === 'development',
    },
  ],

  // 开发配置
  development: {
    // 是否启用热重载
    hotReload: true,
    // 开发服务器端口
    devPort: 3100,
  },
}
