import { type Ref, forwardRef } from 'react'

interface ButtonProps {
  type?: 'primary' | 'default'
  text?: string
}

const Button = (props: ButtonProps, ref: Ref<HTMLButtonElement>) => {
  return (
    <button ref={ref} type='button' className='w-full h-full'>
      {props?.text}
    </button>
  )
}

export default forwardRef(Button)
