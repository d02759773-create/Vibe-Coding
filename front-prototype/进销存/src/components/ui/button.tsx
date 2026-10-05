import { Button as AntButton } from 'antd'
import type { ButtonProps as AntButtonProps } from 'antd'

type LegacyVariant = 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link'
type LegacySize = 'default' | 'xs' | 'sm' | 'lg' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg'

export type ButtonProps = Omit<AntButtonProps, 'size' | 'type' | 'variant'> & {
  variant?: LegacyVariant
  size?: LegacySize | AntButtonProps['size']
  /** HTML button 或 Ant Design 按钮类型 */
  type?: AntButtonProps['type'] | 'button' | 'submit' | 'reset'
}

const legacySizeMap: Partial<Record<LegacySize, AntButtonProps['size']>> = {
  xs: 'small',
  sm: 'small',
  default: 'middle',
  lg: 'large',
  icon: 'middle',
  'icon-xs': 'small',
  'icon-sm': 'small',
  'icon-lg': 'large',
}

function mapVariant(variant: LegacyVariant): Pick<AntButtonProps, 'type' | 'danger' | 'ghost'> {
  switch (variant) {
    case 'default':
      return { type: 'primary' }
    case 'destructive':
      return { type: 'primary', danger: true }
    case 'link':
      return { type: 'link' }
    case 'ghost':
      return { type: 'text' }
    case 'outline':
      return { type: 'default' }
    case 'secondary':
      return { type: 'default' }
    default:
      return { type: 'default' }
  }
}

function resolveSize(size: ButtonProps['size']): AntButtonProps['size'] {
  if (!size || size === 'middle' || size === 'small' || size === 'large') {
    return (size as AntButtonProps['size']) ?? 'middle'
  }
  return legacySizeMap[size as LegacySize] ?? 'middle'
}

export function Button({
  variant,
  size = 'middle',
  className,
  type,
  danger,
  ghost,
  htmlType,
  ...props
}: ButtonProps) {
  let resolvedHtmlType = htmlType
  let antType: AntButtonProps['type'] | undefined

  if (type === 'button' || type === 'submit' || type === 'reset') {
    resolvedHtmlType = type
  } else if (type) {
    antType = type
  }

  const mapped = variant ? mapVariant(variant) : {}

  return (
    <AntButton
      htmlType={resolvedHtmlType}
      type={antType ?? mapped.type}
      danger={danger ?? mapped.danger}
      ghost={ghost ?? mapped.ghost}
      size={resolveSize(size)}
      className={className}
      {...props}
    />
  )
}

/** @deprecated 迁移至 Ant Design Button */
export const buttonVariants = undefined
