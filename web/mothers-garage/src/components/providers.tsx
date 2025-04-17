"use client"

import { I18nextProvider } from "react-i18next"
import i18n from "@/lib/i18n"
import type { ReactNode } from "react"

interface ProvidersProps {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
