import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-2.5 gap-y-0.5 items-start [&>svg]:size-4.5 [&>svg]:translate-y-1 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        info: "text-jewel-blue bg-pastel-blue/50 [&>svg]:text-current *:data-[slot=alert-description]:text-jewel-blue/90 border border-jewel-blue",
        warning:
          "text-jewel-yellow bg-pastel-yellow/50 [&>svg]:text-current *:data-[slot=alert-description]:text-jewel-yellow/90 border border-jewel-yellow",
        success:
          "text-jewel-green bg-pastel-green/50 [&>svg]:text-current *:data-[slot=alert-description]:text-jewel-green/90 border border-jewel-green",
        destructive:
          "text-jewel-red bg-pastel-red/50 [&>svg]:text-current *:data-[slot=alert-description]:text-jewel-red/90 border border-jewel-red",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 -mb-0.5 min-h-4 font-bold tracking-tight",
        className
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        className
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
