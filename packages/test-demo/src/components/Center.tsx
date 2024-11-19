import { editor, project, simulator } from '@/editor'
import { DocumentSchemaRender } from '@easy-editor/react-renderer'
import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'

const Center = observer(() => {
  const viewportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (viewportRef.current) {
      project.open()

      simulator.mountViewport(viewportRef.current)
      simulator.setupEvents()
    }
  }, [])

  return (
    <div className='flex-1 bg-gray-50 overflow-auto'>
      <div className='h-full p-8'>
        {/* <div className='bg-white rounded-lg h-full border-2 border-dashed border-gray-300 flex items-center justify-center'>
          <p className='text-gray-500'>拖拽组件到这里</p>
        </div> */}
        <div className='bg-white rounded-lg h-full border-2 border-dashed border-gray-300 relative' ref={viewportRef}>
          <DocumentSchemaRender
            editor={editor}
            schema={{
              id: '1',
              name: '1',
              rootNode: {
                id: '2',
                componentName: 'Button',
                props: {
                  text: '按钮',
                },
              },
            }}
            designMode='design'
          />
        </div>
      </div>
    </div>
  )
})

export default Center
