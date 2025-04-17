"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Video, Heart, BookOpen, LogOut, Settings, ChevronRight, AlertTriangle, CheckCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { api } from "@/lib/api"
import { Progress } from "@/components/ui/progress"
import { PageContainer } from "@/components/page-container"
import { Badge } from "@/components/ui/badge"

interface ProviderData {
  services: string[]
}

interface SubscriptionData {
  plan: string
  bookings_used: number
  booking_limit: number
  days_remaining: number
  is_limit_reached: boolean
  next_renewal_date?: string
  should_warn: boolean
}

export default function WorkspaceSelect() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [providerData, setProviderData] = useState<ProviderData | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [settingsLink, setSettingsLink] = useState<string>("")
  const [hoveredService, setHoveredService] = useState<string | null>(null)

  useEffect(() => {
    const fetchProviderData = async () => {
      try {
        setIsLoading(true)
        const response = await api.getProviderWorkspaces()

        if (!response) {
          throw new Error("No data returned from provider workspace endpoint.")
        }

        const { services, subscription, settings_link } = response

        if (!services || !Array.isArray(services) || !subscription) {
          throw new Error("Incomplete provider data. Required fields are missing.")
        }

        setProviderData({ services })
        setSubscription(subscription)
        setSettingsLink(settings_link || "/provider/settings")
      } catch (error) {
        console.error("Error fetching provider data:", error)
        toast({
          title: "Error",
          description: "Failed to load your workspace data. Please try again or contact support.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProviderData()
  }, [toast])

  const handleSelectWorkspace = (workspace: string) => {
    localStorage.setItem("selectedWorkspace", workspace)
    router.push("/provider/dashboard")
  }

  const navigateToSettings = () => {
    router.push("/provider/settings")
  }

  const handleLogout = () => {
    api
      .logout(localStorage.getItem("refresh_token") || "")
      .then(() => {
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        router.push("/auth/login")
      })
      .catch((error) => {
        console.error("Logout error:", error)
      })
  }

  const serviceIcons = {
    Teletherapy: <Video className="h-8 w-8 text-white" />,
    "Home Care": <Heart className="h-8 w-8 text-white" />,
    "E-learning": <BookOpen className="h-8 w-8 text-white" />,
  }

  const serviceColors = {
    Teletherapy: "#832D90",
    "Home Care": "#C46B41",
    "E-learning": "#4B9CD3",
  }

  const getServiceColor = (service: string): string => {
    return serviceColors[service as keyof typeof serviceColors] || "#832D90"
  }

  const getBookingUsagePercentage = (): number => {
    if (!subscription) return 0
    if (subscription.plan === "premium") return 100
    return Math.min(100, (subscription.bookings_used / subscription.booking_limit) * 100)
  }

  const getBookingUsageColor = (): string => {
    const percentage = getBookingUsagePercentage()
    if (percentage >= 90) return "bg-red-500"
    if (percentage >= 70) return "bg-yellow-500"
    return "bg-green-500"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#832D90] border-t-transparent"></div>
          <p className="text-gray-500">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  if (!providerData || !subscription) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
            <CardDescription>We couldn&apos;t load your workspace data</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 mb-4">
              There was a problem loading your provider workspace data. Please try again or contact support.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.location.reload()} className="w-full">
              Retry
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <PageContainer className="py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Image src="/motherslogo.png" alt="Mother's Garage Logo" width={40} height={40} className="rounded-md" />
              <span className="font-bold text-xl text-[#832D90]">Mother&apos;s Garage</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={navigateToSettings}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </PageContainer>
      </header>

      <PageContainer className="py-8">
        {/* Subscription Warning */}
        {subscription.should_warn && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="bg-amber-100 rounded-full p-2 mt-0.5">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-800 mb-1">Subscription Expiring Soon</h3>
                <p className="text-amber-700">
                  Your subscription expires in <span className="font-semibold">{subscription.days_remaining} days</span>
                  . Renew now to avoid any disruption to your services.
                </p>
                <Button className="mt-3 bg-amber-600 hover:bg-amber-700 text-white">Renew Subscription</Button>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Info Card */}
        <Card className="mb-8 border-none shadow-md overflow-hidden">
          <div className="h-2 bg-[#832D90] w-full"></div>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <CardTitle className="text-xl mb-1">
                  <span className="text-[#832D90] font-bold">
                    {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
                  </span>{" "}
                  Subscription
                </CardTitle>
                <CardDescription>
                  {subscription.next_renewal_date && (
                    <span>
                      Renews on{" "}
                      <span className="font-medium">
                        {new Date(subscription.next_renewal_date).toLocaleDateString()}
                      </span>
                    </span>
                  )}
                </CardDescription>
              </div>
              <Badge
                className={`${
                  subscription.plan === "premium"
                    ? "bg-[#832D90]"
                    : subscription.plan === "standard"
                      ? "bg-[#C46B41]"
                      : "bg-gray-500"
                } hover:${
                  subscription.plan === "premium"
                    ? "bg-[#832D90]/90"
                    : subscription.plan === "standard"
                      ? "bg-[#C46B41]/90"
                      : "bg-gray-500/90"
                } px-3 py-1.5`}
              >
                {subscription.plan === "premium" ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" /> Premium Plan
                  </span>
                ) : subscription.plan === "standard" ? (
                  "Standard Plan"
                ) : (
                  "Basic Plan"
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-500">
                    Bookings: {subscription.bookings_used} /{" "}
                    {subscription.plan === "premium" ? "Unlimited" : subscription.booking_limit}
                  </span>
                  <span className="text-sm font-medium">
                    {subscription.plan === "premium" ? "Unlimited" : `${Math.round(getBookingUsagePercentage())}%`}
                  </span>
                </div>
                <Progress
                  value={getBookingUsagePercentage()}
                  className="h-2 bg-gray-100"
                  indicatorClassName={getBookingUsageColor()}
                />
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <div className="bg-gray-50 rounded-lg px-4 py-2 border border-gray-100">
                  <span className="text-xs text-gray-500 block">Days Remaining</span>
                  <span className="text-lg font-semibold text-gray-800">{subscription.days_remaining}</span>
                </div>

                {subscription.is_limit_reached && (
                  <div className="bg-red-50 rounded-lg px-4 py-2 border border-red-100">
                    <span className="text-xs text-red-500 block">Booking Limit Reached</span>
                    <span className="text-sm font-medium text-red-600">Upgrade to continue</span>
                  </div>
                )}

                <div className="ml-auto">
                  <Button variant="outline" className="border-[#832D90] text-[#832D90] hover:bg-[#832D90]/5">
                    Manage Subscription
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workspace Selection */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Select Your Workspace</h2>
          <p className="text-gray-600 mb-6">Choose which service area you&apos;d like to manage today</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {providerData.services.map((service) => (
              <div
                key={service}
                className="group relative"
                onMouseEnter={() => setHoveredService(service)}
                onMouseLeave={() => setHoveredService(null)}
              >
                <Card
                  className={`h-full border-none shadow-md hover:shadow-lg transition-all overflow-hidden ${
                    hoveredService === service ? "transform -translate-y-1" : ""
                  }`}
                  onClick={() => handleSelectWorkspace(service)}
                >
                  <div className="h-2 w-full" style={{ backgroundColor: getServiceColor(service) }}></div>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-4">
                      <div
                        className="h-14 w-14 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: getServiceColor(service) }}
                      >
                        {serviceIcons[service as keyof typeof serviceIcons] || (
                          <div className="h-8 w-8 bg-white/20 rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-xl">{service}</CardTitle>
                        <CardDescription>Manage your {service.toLowerCase()} services</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <p className="text-sm text-gray-600 mb-4">
                      {service === "Teletherapy"
                        ? "Manage your virtual therapy sessions, appointments, and client communications."
                        : service === "Home Care"
                          ? "Coordinate in-home care services, schedules, and client needs assessments."
                          : "Create and manage your educational content, courses, and student progress."}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full group-hover:bg-opacity-90 transition-all flex items-center justify-center"
                      style={{ backgroundColor: getServiceColor(service) }}
                    >
                      Enter Workspace
                      <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <Card className="border-none shadow-sm bg-gray-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm" className="bg-white" onClick={navigateToSettings}>
                <Settings className="h-4 w-4 mr-2" />
                Account Settings
              </Button>
              <Button variant="outline" size="sm" className="bg-white">
                <Heart className="h-4 w-4 mr-2" />
                Help Center
              </Button>
              <Button variant="outline" size="sm" className="bg-white">
                <BookOpen className="h-4 w-4 mr-2" />
                Provider Resources
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto py-6">
        <PageContainer>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">© {new Date().getFullYear()} Mother&apos;s Garage. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-gray-500 hover:text-[#832D90]">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-[#832D90]">
                Terms of Service
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-[#832D90]">
                Contact Support
              </a>
            </div>
          </div>
        </PageContainer>
      </footer>
    </div>
  )
}
