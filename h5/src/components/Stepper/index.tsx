import { Stepper } from 'antd-mobile'

interface QuantityStepperProps {
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
}

/** 商品数量步进器，封装 antd-mobile Stepper，主题色由全局变量覆盖 */
export const QuantityStepper = ({ value, min = 1, max = 99, onChange }: QuantityStepperProps) => {
  return (
    <Stepper
      value={value}
      min={min}
      max={max}
      step={1}
      onChange={(val) => onChange(val as number)}
      style={{
        '--border': '1px solid var(--border-color)',
        '--border-inner': '1px solid var(--border-color)',
        '--height': '56px',
        '--input-width': '72px',
        '--active-border': 'var(--primary-color)',
      }}
    />
  )
}
