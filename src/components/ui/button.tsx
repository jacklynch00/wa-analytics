import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--button-primary-bg)] text-white border-none rounded-[var(--radius-medium)] px-4 py-[10px] font-medium shadow-[var(--shadow-button)] hover:bg-[var(--button-primary-hover)] hover:shadow-[var(--shadow-button-hover)] active:bg-[var(--button-primary-active)] animate-button-hover focus-visible:outline-[var(--focus-outline)] focus-visible:outline-offset-[var(--focus-offset)]",
        destructive:
          "bg-[var(--warning)] text-white border-none rounded-[var(--radius-medium)] px-4 py-[10px] font-medium shadow-[var(--shadow-button)] hover:bg-[#d93025] animate-button-hover focus-visible:outline-[var(--focus-outline)] focus-visible:outline-offset-[var(--focus-offset)]",
        outline:
          "border border-[var(--border)] bg-[var(--card-bg)] rounded-[var(--radius-medium)] px-4 py-[10px] font-medium text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)] animate-button-hover focus-visible:outline-[var(--focus-outline)] focus-visible:outline-offset-[var(--focus-offset)]",
        secondary:
          "bg-[var(--card-hover-bg)] text-[var(--text-primary)] border border-[var(--border)] rounded-[var(--radius-medium)] px-4 py-[10px] font-medium hover:bg-[var(--border)] animate-button-hover focus-visible:outline-[var(--focus-outline)] focus-visible:outline-offset-[var(--focus-offset)]",
        ghost:
          "bg-transparent text-[var(--text-secondary)] border-none rounded-[var(--radius-small)] px-2 py-2 hover:bg-[var(--icon-hover-bg)] hover:text-[var(--text-primary)] animate-icon-hover focus-visible:outline-[var(--focus-outline)] focus-visible:outline-offset-[var(--focus-offset)]",
        link: "text-[var(--brand)] underline-offset-4 hover:underline bg-transparent border-none p-0",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-[var(--radius-medium)] gap-1.5 px-3 text-xs",
        lg: "h-10 rounded-[var(--radius-medium)] px-6 text-base",
        icon: "size-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
