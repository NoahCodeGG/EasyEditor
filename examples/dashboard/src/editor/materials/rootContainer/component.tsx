import type { Ref } from 'react'

interface RootContainerProps {
  ref: Ref<HTMLDivElement>
  backgroundColor?: string
  children?: React.ReactNode
}

const RootContainer = (props: RootContainerProps) => {
  return (
    <div ref={props.ref} className='w-full h-full' style={{ backgroundColor: props?.backgroundColor }}>
      {props?.children}
    </div>
  )
}

export default RootContainer
