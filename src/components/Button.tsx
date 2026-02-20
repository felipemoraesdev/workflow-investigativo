import { memo } from 'react'
import { twMerge } from 'tailwind-merge'

type ButtonVariant = 'primary' | 'secondary'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
}

const Button = memo(function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return (
    <button
      type={props.type ?? 'button'}
      className={twMerge(
        'rounded-md border px-3 py-2 text-xs font-medium transition cursor-pointer',
        variant === 'primary'
          ? 'border-cyan-500/50 bg-cyan-500/20 text-cyan-100 hover:opacity-90'
          : 'border-slate-700 text-slate-200 hover:border-slate-500',
        className,
      )}
      {...props}
    />
  )
})

export default Button
