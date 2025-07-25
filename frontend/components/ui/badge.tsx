import type * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-slate-800 text-slate-50 shadow hover:bg-slate-900",
        secondary: "border-transparent bg-slate-100 text-slate-700 hover:bg-slate-200",
        destructive: "border-transparent bg-rose-500 text-slate-50 shadow hover:bg-rose-600",
        outline: "border-slate-200 text-slate-700 hover:bg-slate-50",
        success: "border-transparent bg-emerald-500 text-white shadow hover:bg-emerald-600",
        warning: "border-transparent bg-amber-500 text-white shadow hover:bg-amber-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
