import { type PropsWithChildren, type Ref, forwardRef } from 'react'

interface GroupProps extends PropsWithChildren {}

const Group = (props: GroupProps, ref: Ref<HTMLDivElement>) => {
  return (
    // TODO: className 需要调整，需要通用的方式
    <div ref={ref} className='relative w-full h-full'>
      {props?.children}
    </div>
  )
}

export default forwardRef(Group)
