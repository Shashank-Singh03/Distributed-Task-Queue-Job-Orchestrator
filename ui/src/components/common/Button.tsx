import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
}

export default function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses = 'px-4 py-2 rounded-md text-sm font-medium focus-ring transition-colors'
  const variantClasses = {
    primary: 'bg-gray-900 text-white hover:bg-gray-800',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      type={props.type || 'button'}
      {...props}
    >
      {children}
    </button>
  )
}

