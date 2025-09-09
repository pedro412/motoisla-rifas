import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cn } from "@/lib/utils"

export type LabelProps = React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  )
)
Label.displayName = "Label"

export { Label }
