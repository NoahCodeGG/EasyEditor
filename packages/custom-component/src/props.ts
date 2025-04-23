export const propDefinitions = [
  {
    name: 'title',
    title: '标题',
    setter: 'StringSetter',
    defaultValue: '自定义组件',
  },
  {
    name: 'content',
    title: '内容',
    setter: 'TextAreaSetter',
    defaultValue: '这是一个自定义组件示例',
  },
  {
    name: 'theme',
    title: '主题',
    setter: 'SelectSetter',
    defaultValue: 'light',
    extraProps: {
      options: [
        { label: '浅色', value: 'light' },
        { label: '深色', value: 'dark' },
        { label: '彩色', value: 'colorful' },
      ],
    },
  },
  {
    name: 'fontSize',
    title: '字体大小',
    setter: 'NumberSetter',
    defaultValue: 16,
    extraProps: {
      min: 12,
      max: 32,
      step: 1,
    },
  },
  {
    name: 'showBorder',
    title: '显示边框',
    setter: 'BoolSetter',
    defaultValue: true,
  },
  {
    name: 'borderColor',
    title: '边框颜色',
    setter: 'ColorSetter',
    defaultValue: '#1890ff',
    condition: target => {
      return target.getProps().getPropValue('showBorder') === true
    },
  },
  {
    name: 'refreshInterval',
    title: '刷新间隔(秒)',
    setter: 'NumberSetter',
    defaultValue: 0,
    extraProps: {
      min: 0,
      max: 60,
      step: 1,
    },
  },
]
