import type { Ref } from 'react'
import { Button } from '../../components/ui/button'

interface ButtonProps {
  ref: Ref<HTMLButtonElement>
  text?: string
  onClick?: () => void
}

const MaterialButton = (props: ButtonProps) => {
  const { ref, text, onClick, ...rest } = props
  console.log('🚀 ~ MaterialButton ~ props:', props)

  return (
    <Button ref={ref} className='w-full h-full' onClick={onClick} variant='destructive' {...rest}>
      {text}
    </Button>
  )
}

export default MaterialButton
