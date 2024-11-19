import { designer } from '@/editor'
import { observer } from 'mobx-react-lite'

const Left = observer(() => {
  const snippets = designer.componentMetaManager.getComponentSnippets()

  return (
    <div className='w-64 bg-white border-r border-gray-200 flex flex-col'>
      <div className='p-4 border-b border-gray-200'>
        <h2 className='text-lg font-medium text-gray-700'>组件库</h2>
      </div>
      <div className='flex-1 overflow-y-auto p-4'>
        <div className='space-y-2'>
          {snippets.map(snippet => (
            <div className='p-3 bg-gray-50 rounded-md cursor-move hover:bg-gray-100 text-center' key={snippet?.title}>
              {snippet?.title}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

export default Left
