import { TRANSFORM_STAGE } from '@easy-editor/core'
import { ReactRenderer } from '@easy-editor/react-renderer'
import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'
import { project, simulator } from '../editor'
import { defaultRootSchema } from '../editor/const'

const Center = observer(() => {
  const viewportRef = useRef<HTMLDivElement>(null)
  const docSchema = project.currentDocument?.export(TRANSFORM_STAGE.RENDER)
  console.log('🚀 ~ Center ~ docSchema:', docSchema)

  useEffect(() => {
    if (viewportRef.current) {
      project.open(defaultRootSchema)

      simulator.mountViewport(viewportRef.current)
      simulator.setupEvents()
    }
  }, [])

  return (
    <div className='flex-1 bg-gray-50 overflow-auto'>
      <div className='h-full p-8 box-border'>
        {/* <div className='bg-white rounded-lg h-full border-2 border-dashed border-gray-300 flex items-center justify-center'>
          <p className='text-gray-500'>拖拽组件到这里</p>
        </div> */}
        <div className='bg-white rounded-lg h-full border-2 border-dashed border-gray-300 relative' ref={viewportRef}>
          {/* {docSchema && <DocumentSchemaRender editor={editor} schema={docSchema} designMode='design' />} */}
          {/* <DashboardRenderer
            components={simulator.components}
            schema={docSchema}
            onCompGetRef={(schema, ref) => console.log('onCompGetRef', schema, ref)}
          /> */}
          <ReactRenderer
            components={simulator.components}
            schema={docSchema}
            onCompGetRef={(schema, ref) => console.log('onCompGetRef', schema, ref)}
          />
        </div>
      </div>
    </div>
  )
})

export default Center
