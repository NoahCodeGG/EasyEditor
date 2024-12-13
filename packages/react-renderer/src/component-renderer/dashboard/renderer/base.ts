import baseRendererFactory from '../../renderer/base'
import { compWrapper } from '../../renderer/hoc/comp'
import { type ComponentConstruct, leafWrapper } from '../../renderer/hoc/leaf'
import { dashboardWrapper } from '../hoc/dashboard'

export const dashboardBaseRendererFactory: () => any = () => {
  const OriginBase = baseRendererFactory()

  return class BaseRenderer extends OriginBase {
    get __componentHOCs(): ComponentConstruct[] {
      console.log('🚀 ~ BaseRenderer ~ get__componentHOCs ~ this.__designModeIsDesign:', this.__designModeIsDesign)
      if (this.__designModeIsDesign) {
        return [dashboardWrapper, leafWrapper, compWrapper]
      }
      return [dashboardWrapper, compWrapper]
    }
  }
}
