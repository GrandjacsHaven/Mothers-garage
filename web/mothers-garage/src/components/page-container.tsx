import type React from "react"
import { Container } from "@/components/ui/container"

interface PageContainerProps {
  children: React.ReactNode
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full" | "none"
  padding?: "none" | "sm" | "default" | "md" | "lg" | "xl"
  className?: string
  withGutter?: boolean
}

/**
 * A consistent container for pages that provides standard padding and width
 */
export function PageContainer({
  children,
  maxWidth = "7xl",
  padding = "default",
  className,
  withGutter = true,
}: PageContainerProps) {
  return (
    <main className={withGutter ? "py-0 md:py-0 px-2" : ""}>
      <Container maxWidth={maxWidth} padding={padding} className={className}>
        {children}
      </Container>
    </main>
  )
}
