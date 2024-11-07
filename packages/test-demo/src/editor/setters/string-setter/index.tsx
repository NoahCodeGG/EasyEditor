interface StringSetterProps {
  value: string
  placeholder: string
  onChange: (val: string) => void
}

const StringSetter = (props: StringSetterProps) => {
  const { value, placeholder, onChange } = props

  return (
    <input
      value={value}
      placeholder={placeholder || ''}
      onChange={(val: any) => onChange(val)}
      style={{ width: '100%' }}
    />
  )
}

export default StringSetter
