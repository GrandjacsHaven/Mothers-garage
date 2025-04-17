"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Bell,
  Calendar,
  Home,
  MessageSquare,
  Settings,
  User,
  BookOpen,
  Users,
  Brain,
  Heart,
  ChevronRight,
  Clock,
  Search,
  Menu,
  Star,
  LogOut,
  X,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { api } from "@/lib/api"
import { PageContainer } from "@/components/page-container"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"

export default function MotherDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [dashboardData, setDashboardData] = useState<{
    welcome_message: string
    modules: string[]
    settings_link: string
    upcoming_appointments?: any[]
    notifications?: any[]
    community_updates?: any[]
  }>({
    welcome_message: "",
    modules: [],
    settings_link: "",
    upcoming_appointments: [],
    notifications: [],
    community_updates: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [firstTimeLogin, setFirstTimeLogin] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [providers, setProviders] = useState<any[]>([])
  const [isLoadingProviders, setIsLoadingProviders] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Wrap checkFirstTimeLogin in useCallback so that its reference stays stable.
  const checkFirstTimeLogin = useCallback(async () => {
    try {
      const response = await api.checkMotherFirstTimeLogin()
      setFirstTimeLogin(response.first_time_login)
      if (response.first_time_login) {
        setShowTutorial(true)
      }
    } catch (error) {
      console.error("Error checking first time login:", error)
      toast({
        title: "Error",
        description: "Failed to check login status. Please refresh the page.",
        variant: "destructive",
      })
    }
  }, [toast])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        // Fetch actual data from the API
        const data = await api.getMotherDashboard()
        setDashboardData(data)
        // Check if this is the first time login
        await checkFirstTimeLogin()
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [toast, checkFirstTimeLogin])

  // Complete the tutorial
  const completeTutorial = async () => {
    try {
      await api.completeMotherTutorial()
      setShowTutorial(false)
      toast({
        title: "Success",
        description: "Tutorial completed successfully!",
      })
    } catch (error) {
      console.error("Error completing tutorial:", error)
      toast({
        title: "Error",
        description: "Failed to complete tutorial. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle module selection - fetch providers for a module
  const handleModuleSelect = async (moduleName: string) => {
    try {
      setIsLoadingProviders(true)
      setSelectedModule(moduleName)
      // Call the API to get providers for this service
      const response = await api.searchProviders(moduleName.toLowerCase())
      setProviders(response.providers)
    } catch (error) {
      console.error("Error fetching providers:", error)
      toast({
        title: "Error",
        description: "Failed to load providers. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingProviders(false)
    }
  }

  // Navigate to settings page.
  const navigateToSettings = () => {
    router.push("/mother/dashboard/settings")
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date)
  }

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "appointment":
        return <Calendar className="h-4 w-4 text-[#832D90]" />
      case "content":
        return <BookOpen className="h-4 w-4 text-[#C46B41]" />
      case "social":
        return <Users className="h-4 w-4 text-[#832D90]" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  // Tutorial component
  const Tutorial = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl text-[#832D90]">Welcome to Mother&apos;s Garage!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 max-h-[60vh] overflow-y-auto">
          <div className="space-y-3 sm:space-y-4">
            <h3 className="font-bold text-lg">Your Dashboard</h3>
            <p className="text-gray-700">
              Welcome to your personalized dashboard! Here you can access all the services and resources available to
              you.
            </p>
            <h4 className="font-semibold">Your Modules</h4>
            <ul className="list-disc list-inside space-y-2">
              {dashboardData.modules.map((module) => (
                <li key={module}>
                  <span className="font-medium">{module}:</span> {getModuleDescription(module)}
                </li>
              ))}
            </ul>
            <p className="text-gray-700">Click on any module to explore the services and providers available to you.</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={completeTutorial} className="bg-[#832D90] hover:bg-[#832D90]/90 w-full sm:w-auto">
            Get Started
          </Button>
        </CardFooter>
      </Card>
    </div>
  )

  // Get module description based on name
  const getModuleDescription = (moduleName: string) => {
    switch (moduleName) {
      case "Teletherapy":
        return "Connect with therapists for virtual sessions"
      case "Home Care":
        return "Schedule in-home care services"
      case "E-Learning":
        return "Access courses and resources"
      case "Social Networking":
        return "Connect with other mothers"
      case "AI for Mothers":
        return "Get AI-powered assistance"
      default:
        return "Explore this module"
    }
  }

  // Get module icon based on name
  const getModuleIcon = (moduleName: string) => {
    switch (moduleName) {
      case "Teletherapy":
        return <MessageSquare className="h-5 w-5 text-white" />
      case "Home Care":
        return <Home className="h-5 w-5 text-white" />
      case "E-Learning":
        return <BookOpen className="h-5 w-5 text-white" />
      case "Social Networking":
        return <Users className="h-5 w-5 text-white" />
      case "AI for Mothers":
        return <Brain className="h-5 w-5 text-white" />
      default:
        return <Star className="h-5 w-5 text-white" />
    }
  }

  // Get module color based on name
  const getModuleColor = (moduleName: string, index: number) => {
    const colors = ["#832D90", "#C46B41", "#C46B41", "#832D90", "#C46B41"]
    switch (moduleName) {
      case "Teletherapy":
        return "#832D90"
      case "Home Care":
        return "#C46B41"
      case "E-Learning":
        return "#C46B41"
      case "Social Networking":
        return "#832D90"
      case "AI for Mothers":
        return "#C46B41"
      default:
        return colors[index % colors.length]
    }
  }

  // Handle logout
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

  // Sidebar content component for reuse
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Image src="/motherslogo.png" alt="Mother&apos;s Garage Logo" width={40} height={40} className="rounded-md" />
          <span className="font-bold text-lg text-[#832D90]">Mother&apos;s Garage</span>
        </div>
      </div>
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[#832D90] flex items-center justify-center text-white font-medium">
            {dashboardData.welcome_message ? dashboardData.welcome_message.charAt(8) : "U"}
          </div>
          <div>
            <p className="font-medium">
              {dashboardData.welcome_message ? dashboardData.welcome_message.substring(8) : "User"}
            </p>
            <p className="text-sm text-gray-500">View Profile</p>
          </div>
        </div>
      </div>
      <nav className="p-4 flex-1 overflow-y-auto">
        <div className="space-y-2">
          <Button variant="ghost" className="w-full justify-start">
            <User className="mr-2 h-4 w-4" />
            My Profile
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={navigateToSettings}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Calendar className="mr-2 h-4 w-4" />
            Appointments
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
          <div className="pt-2 mt-2 border-t">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Modules</h3>
            {dashboardData.modules.map((module) => (
              <Button
                key={module}
                variant="ghost"
                className={`w-full justify-start ${selectedModule === module ? "bg-[#832D90]/10 text-[#832D90]" : ""}`}
                onClick={() => {
                  handleModuleSelect(module)
                  setSidebarOpen(false)
                }}
              >
                {getModuleIcon(module)}
                <span className="ml-2">{module}</span>
              </Button>
            ))}
          </div>
        </div>
      </nav>
      <div className="p-4 border-t mt-auto">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )

  // Count unread notifications
  const unreadNotificationsCount = dashboardData.notifications
    ? dashboardData.notifications.filter((n: any) => !n.read).length
    : 0

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col">
      {/* Show tutorial if it's the first time login */}
      {showTutorial && <Tutorial />}

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-6 w-[280px] sm:w-[350px]">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Header */}
      <header className="bg-white border-b sticky px-0 top-0 z-10 shadow-sm">
        <PageContainer className="py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Image
                  src="/motherslogo.png"
                  alt="Mother&apos;s Garage Logo"
                  width={40}
                  height={40}
                  className="rounded-md"
                />
                <span className="font-bold text-xl text-[#832D90] hidden sm:inline">Mother&apos;s Garage</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="py-2 px-4 pr-10 rounded-full border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#832D90]/30 focus:border-[#832D90] w-[200px]"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              <Button variant="ghost" size="icon" className="relative hover:bg-[#F8F8F8]">
                <Bell className="h-5 w-5 text-gray-600" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-[#832D90] rounded-full"></span>
                )}
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-[#F8F8F8]" onClick={navigateToSettings}>
                <Settings className="h-5 w-5 text-gray-600" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-[#F8F8F8]" onClick={handleLogout}>
                <LogOut className="h-5 w-5 text-gray-600" />
              </Button>
              <div className="h-8 w-8 rounded-full bg-[#832D90] flex items-center justify-center text-white font-medium cursor-pointer">
                {dashboardData.welcome_message ? dashboardData.welcome_message.charAt(8) : "U"}
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-2">
              <Button variant="ghost" size="icon" className="relative hover:bg-[#F8F8F8]">
                <Bell className="h-5 w-5 text-gray-600" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-[#832D90] rounded-full"></span>
                )}
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-[#F8F8F8]" onClick={navigateToSettings}>
                <Settings className="h-5 w-5 text-gray-600" />
              </Button>
            </div>
          </div>
        </PageContainer>
      </header>

      {/* Main Content */}
      <main className="bg-[#F8F8F8] flex-1">
        <PageContainer className="py-4 sm:py-6 md:py-8">
          {/* Welcome Section */}
          <section className="mb-6 sm:mb-8">
            <div className="bg-[#832D90]/10 p-4 sm:p-6 rounded-2xl">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-[#832D90]">
                {isLoading ? "Welcome..." : dashboardData.welcome_message}
              </h1>
              <p className="text-gray-600">Here&apos;s what&apos;s happening with your care today</p>

              <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
                <Button className="bg-white text-[#832D90] hover:bg-[#832D90] hover:text-white transition-colors border border-[#832D90]/20 text-sm sm:text-base">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Appointment
                </Button>
                <Button variant="outline" className="bg-white/50 hover:bg-white text-sm sm:text-base">
                  <Users className="mr-2 h-4 w-4" />
                  Find Providers
                </Button>
              </div>
            </div>
          </section>

          {/* Modules Section */}
          <section className="mb-6 sm:mb-10">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center">
              <span className="h-5 sm:h-6 w-1 bg-[#832D90] rounded-full mr-2"></span>
              Your Modules
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
              {dashboardData.modules.map((module, index) => (
                <ModuleCard
                  key={module}
                  icon={getModuleIcon(module)}
                  title={module}
                  description={getModuleDescription(module)}
                  color={getModuleColor(module, index)}
                  onClick={() => handleModuleSelect(module)}
                  isSelected={selectedModule === module}
                />
              ))}
            </div>
          </section>

          {/* Providers Section - Show when a module is selected */}
          {selectedModule && (
            <section className="mb-6 sm:mb-10">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="h-5 sm:h-6 w-1 bg-[#832D90] rounded-full mr-2"></span>
                  {selectedModule} Providers
                </div>
                <Button variant="ghost" size="sm" className="text-gray-500" onClick={() => setSelectedModule(null)}>
                  <X className="h-4 w-4 mr-1" />
                  Close
                </Button>
              </h2>

              {isLoadingProviders ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#832D90]" />
                </div>
              ) : providers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {providers.map((provider: any) => (
                    <Card key={provider.id} className="border-none shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-2 sm:pb-3">
                        <CardTitle className="text-[#832D90] text-lg">{provider.username}</CardTitle>
                        <CardDescription className="line-clamp-1">
                          Services: {provider.services?.join(", ")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2 sm:pb-3">
                        {provider.specialities &&
                          Array.isArray(provider.specialities) &&
                          provider.specialities.length > 0 && (
                            <div>
                              <p className="font-semibold text-sm">Specialities:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {provider.specialities.slice(0, 3).map((s: string) => (
                                  <Badge key={s} variant="outline" className="text-xs">
                                    {s}
                                  </Badge>
                                ))}
                                {provider.specialities.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{provider.specialities.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" className="w-full">
                          View Profile
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8 bg-white rounded-lg shadow-sm">
                  <div className="h-12 w-12 sm:h-16 sm:w-16 bg-[#832D90]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-[#832D90]" />
                  </div>
                  <p className="text-gray-500 mb-4">No providers found for {selectedModule}</p>
                  <Button className="bg-[#832D90] hover:bg-[#832D90]/90">Browse All Providers</Button>
                </div>
              )}
            </section>
          )}

          {/* Dashboard Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Upcoming Appointments */}
            <section className="lg:col-span-2">
              <Card className="border-none shadow-md h-full">
                <CardHeader className="pb-2 border-b">
                  <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-[#832D90]/10 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-[#832D90]" />
                    </div>
                    Upcoming Appointments
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3 sm:pt-4">
                  {isLoading ? (
                    <div className="space-y-3 sm:space-y-4">
                      <div className="h-16 bg-gray-100 animate-pulse rounded-md"></div>
                      <div className="h-16 bg-gray-100 animate-pulse rounded-md"></div>
                    </div>
                  ) : dashboardData.upcoming_appointments && dashboardData.upcoming_appointments.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      {dashboardData.upcoming_appointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-xl hover:bg-gray-50 transition-colors gap-3 sm:gap-0"
                        >
                          <div className="flex items-center gap-3">
                            <Image
                              src={appointment.avatar || "/placeholder.svg"}
                              alt={appointment.provider_name}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                            <div>
                              <h3 className="font-medium">
                                {appointment.type} with {appointment.provider_name}
                              </h3>
                              <p className="text-sm text-gray-500 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatDate(appointment.date)}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant={appointment.status === "confirmed" ? "default" : "outline"}
                            className={
                              appointment.status === "confirmed"
                                ? "bg-[#832D90] hover:bg-[#832D90]/90 transition-opacity"
                                : "border-[#C46B41] text-[#C46B41] hover:bg-[#C46B41] hover:text-white"
                            }
                            size="sm"
                          >
                            {appointment.status === "confirmed" ? "Join" : "Confirm"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 sm:py-8">
                      <div className="h-12 w-12 sm:h-16 sm:w-16 bg-[#832D90]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-[#832D90]" />
                      </div>
                      <p className="text-gray-500 mb-4">No upcoming appointments</p>
                      <Button className="bg-[#832D90] hover:bg-[#832D90]/90 transition-opacity">
                        Schedule Appointment
                      </Button>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t pt-3 sm:pt-4">
                  <Button variant="ghost" className="w-full text-[#832D90] hover:bg-[#832D90]/5">
                    View All Appointments
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </section>

            {/* Notifications & Quick Links */}
            <section className="space-y-4 sm:space-y-6">
              {/* Notifications */}
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2 border-b">
                  <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-[#C46B41]/10 flex items-center justify-center">
                      <Bell className="h-4 w-4 text-[#C46B41]" />
                    </div>
                    Notifications
                    {unreadNotificationsCount > 0 && (
                      <Badge className="ml-2 bg-[#832D90]">{unreadNotificationsCount}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3 sm:pt-4 max-h-[250px] sm:max-h-[300px] overflow-y-auto">
                  {isLoading ? (
                    <div className="space-y-3">
                      <div className="h-12 bg-gray-100 animate-pulse rounded-md"></div>
                      <div className="h-12 bg-gray-100 animate-pulse rounded-md"></div>
                    </div>
                  ) : dashboardData.notifications && dashboardData.notifications.length > 0 ? (
                    <div className="space-y-2 sm:space-y-3">
                      {dashboardData.notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-2 sm:p-3 border rounded-xl ${
                            notification.read ? "bg-white" : "bg-[#832D90]/5 border-[#832D90]/20"
                          } hover:bg-gray-50 transition-colors`}
                        >
                          <div className="flex gap-2">
                            <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                            <div>
                              <p className="text-sm">{notification.message}</p>
                              <p className="text-xs text-gray-500 mt-1">{formatDate(notification.date)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 sm:py-8">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 bg-[#C46B41]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-[#C46B41]" />
                      </div>
                      <p className="text-gray-500">No new notifications</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t pt-3 sm:pt-4">
                  <Button variant="ghost" className="w-full text-[#832D90] hover:bg-[#832D90]/5">
                    View All Notifications
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>

              {/* Social Updates */}
              <Card className="border-none shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                <CardHeader className="pb-2 border-b">
                  <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-[#C46B41]/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-[#C46B41]" />
                    </div>
                    Community Updates
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3 sm:pt-4 max-h-[250px] sm:max-h-[300px] overflow-y-auto">
                  {isLoading ? (
                    <div className="space-y-3 sm:space-y-4">
                      <div className="h-20 sm:h-24 bg-gray-100 animate-pulse rounded-md"></div>
                      <div className="h-20 sm:h-24 bg-gray-100 animate-pulse rounded-md"></div>
                    </div>
                  ) : dashboardData.community_updates && dashboardData.community_updates.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      {dashboardData.community_updates.map((update) => (
                        <div
                          key={update.id}
                          className="border rounded-xl p-3 sm:p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex gap-3 mb-2">
                            <Image
                              src={update.avatar || "/placeholder.svg"}
                              alt={update.user_name}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                            <div>
                              <h4 className="font-medium">{update.user_name}</h4>
                              <p className="text-xs text-gray-500">{update.time}</p>
                            </div>
                          </div>
                          <p className="text-sm mb-3 line-clamp-3">{update.content}</p>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span className="flex items-center">
                              <Heart className="h-3 w-3 mr-1" /> {update.likes} likes
                            </span>
                            <span>{update.comments} comments</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 sm:py-8">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 bg-[#C46B41]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-[#C46B41]" />
                      </div>
                      <p className="text-gray-500">No community updates</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t pt-3 sm:pt-4">
                  <Button variant="ghost" className="w-full text-[#C46B41] hover:bg-[#C46B41]/5">
                    View Community
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </section>
          </div>
        </PageContainer>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-md z-10">
        <div className="flex justify-around items-center py-2">
          <Button variant="ghost" size="icon" className="flex flex-col items-center gap-1 h-auto py-2">
            <Home className="h-5 w-5 text-[#832D90]" />
            <span className="text-xs">Home</span>
          </Button>
          <Button variant="ghost" size="icon" className="flex flex-col items-center gap-1 h-auto py-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            <span className="text-xs">Appointments</span>
          </Button>
          <Button variant="ghost" size="icon" className="flex flex-col items-center gap-1 h-auto py-2">
            <Users className="h-5 w-5 text-gray-600" />
            <span className="text-xs">Providers</span>
          </Button>
          <Button variant="ghost" size="icon" className="flex flex-col items-center gap-1 h-auto py-2">
            <User className="h-5 w-5 text-gray-600" />
            <span className="text-xs">Profile</span>
          </Button>
        </div>
      </div>

      {/* Footer - Hidden on mobile when bottom nav is present */}
      <footer className="bg-white border-t py-4 sm:py-6 mt-6 sm:mt-12 hidden md:block">
        <PageContainer>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-500">
                © {new Date().getFullYear()} Mother&apos;s Garage. All rights reserved.
              </p>
            </div>
            <div className="flex justify-center md:justify-end space-x-4">
              <Link href="#" className="text-sm text-gray-500 hover:text-[#832D90]">
                Privacy Policy
              </Link>
              <Link href="#" className="text-sm text-gray-500 hover:text-[#832D90]">
                Terms of Service
              </Link>
              <Link href="#" className="text-sm text-gray-500 hover:text-[#832D90]">
                Contact Us
              </Link>
            </div>
          </div>
        </PageContainer>
      </footer>

      {/* Add padding at the bottom on mobile to account for the bottom navigation */}
      <div className="h-16 md:hidden"></div>
    </div>
  )
}

// Module Card Component
function ModuleCard({
  icon,
  title,
  description,
  color,
  onClick,
  isSelected,
}: {
  icon: React.ReactNode
  title: string
  description: string
  color: string
  onClick: () => void
  isSelected: boolean
}) {
  return (
    <Card
      className={`border-none shadow-md hover:shadow-lg transition-all hover:translate-y-[-5px] overflow-hidden cursor-pointer ${
        isSelected ? "ring-2 ring-[#832D90]" : ""
      }`}
      onClick={onClick}
    >
      <div className="h-2 w-full" style={{ backgroundColor: color }} />
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: color }}>
            {icon}
          </div>
          <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <CardDescription className="text-xs sm:text-sm line-clamp-2">{description}</CardDescription>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full text-white text-xs sm:text-sm hover:opacity-90 transition-opacity"
          style={{ backgroundColor: color }}
        >
          Access Module
        </Button>
      </CardFooter>
    </Card>
  )
}
