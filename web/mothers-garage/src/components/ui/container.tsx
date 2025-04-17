import { cn } from "@/lib/utils"
import type React from "react"

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The maximum width of the container
   * @default "max-w-6xl"
   */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full" | "none"

  /**
   * The padding size to apply
   * @default "default"
   */
  padding?: "none" | "sm" | "default" | "md" | "lg" | "xl"

  /**
   * Whether to center the container
   * @default true
   */
  centered?: boolean
}

/**
 * A container component that provides consistent padding and max-width
 */
export function Container({
  children,
  className,
  maxWidth = "6xl",
  padding = "default",
  centered = true,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        // Max width classes
        maxWidth !== "none" && `max-w-${maxWidth === "full" ? "full" : maxWidth}`,

        // Padding classes
        {
          "p-0": padding === "none",
          "p-2 sm:p-3": padding === "sm",
          "p-4 sm:p-6": padding === "default",
          "p-6 sm:p-8": padding === "md",
          "p-8 sm:p-10": padding === "lg",
          "p-10 sm:p-12": padding === "xl",
        },

        // Centering
        centered && "mx-auto",

        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
