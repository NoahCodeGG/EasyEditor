import { type Ref, forwardRef } from 'react'

interface ButtonProps {
  type?: 'primary' | 'default'
  children?: string
}

const Button = (props: ButtonProps, ref: Ref<HTMLButtonElement>) => {
  return (
    <button ref={ref} type='button'>
      {props?.children}
    </button>
  )
}

export default forwardRef(Button)
