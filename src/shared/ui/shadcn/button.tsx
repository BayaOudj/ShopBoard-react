// Adapted from shadcn/ui Button (MIT).
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import styles from './controls.module.css'
const buttonVariants = cva(styles.button, {
  variants: { variant: { default: styles.primary, outline: styles.outline } },
  defaultVariants: { variant: 'default' },
})
export function Button({
  asChild = false,
  variant,
  className,
  ...props
}: ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      data-slot="button"
      className={buttonVariants({ variant, className })}
      {...props}
    />
  )
}
