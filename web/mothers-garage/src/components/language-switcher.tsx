"use client"

import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Globe } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { useEffect, useState } from "react"

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)
  const [userType, setUserType] = useState<"mother" | "provider" | null>(null)

  useEffect(() => {
    // Try to determine user type from URL or localStorage
    const path = window.location.pathname
    if (path.includes("/mother/")) {
      setUserType("mother")
    } else if (path.includes("/provider/")) {
      setUserType("provider")
    }
  }, [])

  const changeLanguage = async (lng: string) => {
    if (isUpdating) return

    // First update the UI immediately for better user experience
    i18n.changeLanguage(lng)
    localStorage.setItem("preferredLanguage", lng)

    // Only attempt to update the backend if we know the user type and user is logged in
    if (userType && localStorage.getItem("access_token")) {
      setIsUpdating(true)

      try {
        // Map language code to full name if needed
        const languageName = lng === "en" ? "English" : "French"

        // Update the user's preferred language in the backend
        if (userType === "mother") {
          await api.updateMotherSettings({ preferred_language: languageName })
        } else if (userType === "provider") {
          await api.updateProviderSettings({ preferred_language: languageName })
        }

        toast({
          title: "Language updated",
          description: `Your preferred language has been updated to ${languageName}.`,
        })
      } catch (error) {
        console.error("Failed to update language preference:", error)
        toast({
          title: "Error",
          description: "Failed to update language preference. UI language changed locally only.",
          variant: "destructive",
        })
      } finally {
        setIsUpdating(false)
      }
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Globe className="h-5 w-5" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => changeLanguage("en")}>
          <span className={i18n.language === "en" ? "font-bold" : ""}>English</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage("fr")}>
          <span className={i18n.language === "fr" ? "font-bold" : ""}>Français</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
