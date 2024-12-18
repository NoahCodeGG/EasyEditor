import { SimulatorRenderer } from '@easy-editor/react-renderer-dashboard'
import { observer } from 'mobx-react'
import { simulator } from '../editor'

const Center = observer(() => {
  return (
    <div className='flex-1 bg-gray-50 overflow-auto'>
      <div className='h-full p-8 box-border'>
        {/* <div className='bg-white rounded-lg h-full border-2 border-dashed border-gray-300 flex items-center justify-center'>
          <p className='text-gray-500'>拖拽组件到这里</p>
        </div> */}
        <div className='rounded-lg h-full border-2 border-dashed border-gray-300 relative'>
          {/* {docSchema && <DocumentSchemaRender editor={editor} schema={docSchema} designMode='design' />} */}
          {/* <DashboardRenderer
            components={simulator.components}
            schema={docSchema}
            onCompGetRef={(schema, ref) => console.log('onCompGetRef', schema, ref)}
            onCompGetCtx={(schema, ctx) => console.log('onCompGetCtx', schema, ctx)}
            designMode='design'
          /> */}
          {/* <ReactRenderer
            components={simulator.components}
            schema={docSchema}
            onCompGetRef={(schema, ref) => console.log('onCompGetRef', schema, ref)}
          /> */}
          {/* <div ref={viewportRef} id='app' className='w-full h-full' /> */}
          <SimulatorRenderer host={simulator} />
        </div>
      </div>
    </div>
  )
})

export default Center
