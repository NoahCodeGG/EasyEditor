import type { NodeSchema } from '@easy-editor/core'
import { Component, createElement } from 'react'
import { createForwardRefHocElement } from '../../renderer'
import type { ComponentHocInfo } from '../../renderer/hoc'

export function dashboardWrapper(Comp: any, { schema, baseRenderer, componentInfo, scope }: ComponentHocInfo) {
  // if (cache.has(options.schema.id) && cache.get(options.schema.id)?.Comp === Comp) {
  //   return cache.get(options.schema.id)?.WrapperComponent
  // }

  const getNode = baseRenderer.props?.getNode
  const container = baseRenderer.props?.__container
  const host = baseRenderer.props?.__host
  const designer = host?.designer

  class Wrapper extends Component {
    render() {
      console.log('dashboardInfo', this.props)
      const { forwardRef, ...rest } = this.props
      const { __designMode } = this.props

      const rect = computeRect(schema)
      console.log('🚀 ~ Wrapper ~ render ~ rect:', rect)
      let isHover = false
      let isSelected = false

      if (__designMode === 'design') {
        isHover = designer?.detecting.current?.id === schema.id
        isSelected = designer?.selection.has(schema.id!) ?? false
      }

      // return createElement(Comp, { ...rest, ref: forwardRef })
      return (
        // mask 层
        <div
          id={`${schema.id}-mask`}
          style={{
            position: 'absolute',
            left: rect.x,
            top: rect.y,
            width: rect.width,
            height: rect.height,
            border: isSelected ? '2px solid red' : isHover ? '1px solid blue' : 'none',
            userSelect: 'none',
            touchAction: 'none',
            pointerEvents: 'auto',
            // boxSizing: 'border-box',
          }}
        >
          {/* 重置坐标系 */}
          <div
            style={{
              position: 'absolute',
              left: -rect.x!,
              top: -rect.y!,
            }}
          >
            {/* 组件坐标定位 */}
            <div
              id={schema.id}
              style={{
                position: 'absolute',
                left: rect.x!,
                top: rect.y!,
                width: rect.width,
                height: rect.height,
              }}
            >
              {/* 组件渲染 */}
              {/* <Comp {...compProps}>
                {children && (
                  // 再次重置坐标系，用于内部组件定位
                  <div
                    style={{
                      position: 'absolute',
                      left: -rect.x!,
                      top: -rect.y!,
                    }}
                  >
                    {children}
                  </div>
                )}
              </Comp> */}
              {createElement(Comp, { ...rest, ref: forwardRef })}
            </div>
          </div>
        </div>
      )
    }
  }
  ;(Wrapper as any).displayName = Comp.displayName

  const WrapperComponent = createForwardRefHocElement(Wrapper, Comp)

  // cache.set(options.schema.id, { WrapperComponent, Comp })

  return WrapperComponent
}

const NodeMask = (props: NodeMaskProps) => {
  const { schema, Comp, compProps, children } = props
  const designer = editor?.get<Designer>('designer')

  const rect = computeRect(schema)
  let isHover = false
  let isSelected = false

  if (designMode === 'design') {
    isHover = designer?.detecting.current?.id === schema.id
    isSelected = designer?.selection.has(schema.id!) ?? false
  }

  // TODO: 是否需要使用 transform 来移动，而不是使用绝对定位
  return (
    // mask 层
    <div
      id={`${schema.id}-mask`}
      style={{
        position: 'absolute',
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        border: isSelected ? '2px solid red' : isHover ? '1px solid blue' : 'none',
        userSelect: 'none',
        touchAction: 'none',
        pointerEvents: 'auto',
        // boxSizing: 'border-box',
      }}
    >
      {/* 重置坐标系 */}
      <div
        style={{
          position: 'absolute',
          left: -rect.x!,
          top: -rect.y!,
        }}
      >
        {/* 组件坐标定位 */}
        <div
          id={schema.id}
          style={{
            position: 'absolute',
            left: rect.x!,
            top: rect.y!,
            width: rect.width,
            height: rect.height,
          }}
        >
          {/* 组件渲染 */}
          <Comp {...compProps}>
            {children && (
              // 再次重置坐标系，用于内部组件定位
              <div
                style={{
                  position: 'absolute',
                  left: -rect.x!,
                  top: -rect.y!,
                }}
              >
                {children}
              </div>
            )}
          </Comp>
        </div>
      </div>
    </div>
  )
}

/**
 * 计算节点在 dashboard 中的位置信息
 */
const computeRect = (node: NodeSchema) => {
  if (!node.isGroup || !node.children || node.children.length === 0) {
    return node.$dashboard.rect
  }

  let [minX, minY, maxX, maxY] = [
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ]

  for (const child of node.children) {
    let childRect: any
    if (child.isGroup) {
      childRect = computeRect(child)
    } else {
      childRect = child.$dashboard.rect
    }
    const x = childRect.x
    const y = childRect.y
    const width = childRect.width || 0
    const height = childRect.height || 0

    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x + width)
    maxY = Math.max(maxY, y + height)
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}
