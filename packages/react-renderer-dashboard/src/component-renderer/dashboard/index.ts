import {
  type RenderComponent,
  adapter,
  componentRendererFactory,
  pageRendererFactory,
  rendererFactory,
} from '../renderer'
import { dashboardBaseRendererFactory } from './renderer/base'

function factory(): RenderComponent {
  adapter.setRenderers({
    BaseRenderer: dashboardBaseRendererFactory(),
    PageRenderer: pageRendererFactory(),
    ComponentRenderer: componentRendererFactory(),
  })

  return rendererFactory()
  // const Renderer = rendererFactory()
  // return class ReactRenderer extends Renderer implements Component {
  //   readonly props: RendererProps

  //   context: ContextType<any>

  //   setState: (state: RendererState, callback?: () => void) => void

  //   forceUpdate: (callback?: () => void) => void

  //   refs: {
  //     [key: string]: ReactInstance
  //   }

  //   constructor(props: RendererProps, context: ContextType<any>) {
  //     super(props, context)
  //   }

  //   isValidComponent(obj: any) {
  //     return obj?.prototype?.isReactComponent || obj?.prototype instanceof Component
  //   }
  // }
}

// export const DashboardRenderer = factory()

// export default DashboardRenderer
