import { editor } from '../editor'

const Header = () => {
  return (
    <header className='h-14 bg-white border-b border-gray-200 flex items-center px-4 shadow-sm'>
      <div className='flex items-center justify-between w-full'>
        <div className='flex items-center space-x-4'>
          <h1 className='text-xl font-semibold text-gray-800'>低代码平台</h1>
        </div>
        <div className='flex items-center space-x-4'>
          <button
            type='button'
            className='px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600'
            onClick={() => {
              editor.setAssets({
                version: '1.0.0',
                packages: [
                  {
                    package: 'moment',
                    version: '2.30.1',
                    urls: ['https://unpkg.com/moment@2.30.1/moment.js'],
                    library: 'moment',
                  },
                  {
                    package: 'lodash',
                    version: '4.17.21',
                    urls: ['https://unpkg.com/lodash@4.17.21/lodash.js'],
                    library: '_',
                  },
                ],
                components: [
                  {
                    exportName: 'AlilcAntdLowcodeMaterialsMeta',
                    componentName: 'AlilcAntdLowcodeMaterialsMeta',
                    npm: {
                      package: '@alilc/antd-lowcode-materials',
                      version: '1.2.1',
                    },
                    url: 'https://alifd.alicdn.com/npm/@alilc/antd-lowcode-materials@1.2.1/build/lowcode/meta.js',
                    urls: {
                      default: 'https://alifd.alicdn.com/npm/@alilc/antd-lowcode-materials@1.2.1/build/lowcode/meta.js',
                    },
                  },
                ],
              })

              // designer.loadIncrementalAssets({
              //   version: '1.0.0',
              //   packages: [
              //     {
              //       package: 'moment',
              //       version: '2.30.1',
              //       urls: ['https://unpkg.com/moment@2.30.1/moment.js'],
              //       library: 'moment',
              //     },
              //     {
              //       package: 'lodash',
              //       version: '4.17.21',
              //       urls: ['https://unpkg.com/lodash@4.17.21/lodash.js'],
              //       library: '_',
              //     },
              //   ],
              //   components: [],
              // })
            }}
          >
            加载资产包
          </button>
          <button type='button' className='px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600'>
            预览
          </button>
          <button type='button' className='px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600'>
            保存
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
