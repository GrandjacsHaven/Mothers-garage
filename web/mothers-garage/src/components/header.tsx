"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, X, User, LogOut, Settings, Home, Calendar, MessageSquare, Heart } from 'lucide-react'
import LanguageSwitcher from "@/components/language-switcher"
import { useTranslation } from "react-i18next"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface HeaderProps {
  userType?: "mother" | "provider" | null
  userName?: string
  userAvatar?: string
  
}
type NavLink = {
  href: string
  label: string
  icon?: React.ReactNode  // ✅ optional
}

export default function Header({ userType, userName, userAvatar }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { t } = useTranslation()
  
  const isLoggedIn = !!userType
  const isMotherDashboard = pathname?.includes("/mother/")
  const isProviderDashboard = pathname?.includes("/provider/")
  const isDashboard = isMotherDashboard || isProviderDashboard

  const handleLogout = () => {
    // Clear auth token
    localStorage.removeItem("auth_token")
    // Redirect to home page
    window.location.href = "/"
  }

  const motherLinks = [
    { href: "/mother/dashboard", label: t("navigation.dashboard"), icon: <Home className="h-4 w-4 mr-2" /> },
    { href: "/mother/appointments", label: t("navigation.appointments"), icon: <Calendar className="h-4 w-4 mr-2" /> },
    { href: "/mother/teletherapy", label: t("navigation.teletherapy"), icon: <MessageSquare className="h-4 w-4 mr-2" /> },
    { href: "/mother/favorites", label: t("navigation.favorites"), icon: <Heart className="h-4 w-4 mr-2" /> },
  ]

  const providerLinks = [
    { href: "/provider/dashboard", label: t("navigation.dashboard"), icon: <Home className="h-4 w-4 mr-2" /> },
    { href: "/provider/appointments", label: t("navigation.appointments"), icon: <Calendar className="h-4 w-4 mr-2" /> },
    { href: "/provider/clients", label: t("navigation.clients"), icon: <User className="h-4 w-4 mr-2" /> },
    { href: "/provider/services", label: t("navigation.services"), icon: <Heart className="h-4 w-4 mr-2" /> },
  ]

  const navLinks: NavLink[] = isMotherDashboard
  ? motherLinks
  : isProviderDashboard
    ? providerLinks
    : [
        { href: "/", label: t("navigation.home") },
        { href: "/about", label: t("navigation.about") },
        { href: "/services", label: t("navigation.services") },
        { href: "/contact", label: t("navigation.contact") },
      ]

  return (
    <header className="px-6 py-4 border-b bg-white">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/erstaxis1.webp"
              alt="Mother&apos;s Garage Logo"
              width={40}
              height={40}
              className="rounded-md"
            />
            <span className="font-bold text-xl text-[#832D90]">Mother&apos;s Garage</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {isDashboard ? (
            <>
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={`flex items-center text-gray-600 hover:text-[#FF00E1] ${
                    pathname === link.href ? "text-[#FF00E1] font-medium" : ""
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </>
          ) : (
            <>
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={`text-gray-600 hover:text-[#FF00E1] ${
                    pathname === link.href ? "text-[#FF00E1] font-medium" : ""
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          
          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  {userAvatar ? (
                    <Image
                      src={userAvatar || "/erstaxis1.webp"}
                      alt={userName || "User"}
                      fill
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {userName || t("navigation.account")}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/${userType}/profile`} className="flex items-center cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    {t("navigation.profile")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/${userType}/settings`} className="flex items-center cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    {t("navigation.settings")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("navigation.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-3">
              <Link href="/auth/login">
                <Button variant="outline" className="border-[#832D90] text-[#832D90] hover:bg-[#832D90] hover:text-white">
                  {t("navigation.login")}
                </Button>
              </Link>
              <Link href="/onboarding/user-type" className="hidden md:block">
                <Button className="bg-[#FF00E1] hover:bg-[#FF00E1]/90 text-white">
                  {t("navigation.signup")}
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden py-4 px-6 bg-white border-t">
          <nav className="flex flex-col space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center text-gray-600 hover:text-[#FF00E1] ${
                  pathname === link.href ? "text-[#FF00E1] font-medium" : ""
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
            {!isLoggedIn && (
              <Link
                href="/onboarding/user-type"
                className="flex items-center text-[#FF00E1] font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("navigation.signup")}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}