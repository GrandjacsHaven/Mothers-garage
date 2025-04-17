"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter, // ✅ Add this
} from "@/components/ui/card"
import {
  Bell,
  CheckCircle,
  FileText,
  Home,
  LogOut,
  Search,
  Settings,
  User,
  UserPlus,
  Users,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { api } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { isValidEmail, isStrongPassword, passwordsMatch } from "@/lib/utils"

interface PendingProvider {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  phone_number: string
  profession: string
  license_number: string
  bio: string
  associated_clinic_health_center?: string
  certificates: { id: number; name: string; url: string }[]
  created_at: string
}

export default function SuperAdminDashboard() {
  const { toast } = useToast()
  const router = useRouter()

  const [pendingProviders, setPendingProviders] = useState<PendingProvider[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProvider, setSelectedProvider] = useState<PendingProvider | null>(null)
  const [viewCertificateUrl, setViewCertificateUrl] = useState<string | null>(null)
  const [isApproving, setIsApproving] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [certificateOpen, setCertificateOpen] = useState(false)
  const [createAdminOpen, setCreateAdminOpen] = useState(false)
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false)

  const [adminFormData, setAdminFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    confirm_password: "",
  })

  const [formErrors, setFormErrors] = useState({
    username: "",
    email: "",
    password: "",
    confirm_password: "",
  })

  // Wrap fetchPendingProviders in useCallback so that its reference is stable
  const fetchPendingProviders = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await api.getPendingProviders()
      setPendingProviders(data)
    } catch (error) {
      console.error("Error fetching pending providers:", error)
      toast({
        title: "Error",
        description: "Failed to load pending provider applications.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // useEffect now includes fetchPendingProviders as a dependency.
  useEffect(() => {
    fetchPendingProviders()
  }, [fetchPendingProviders])

  const handleLogout = () => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_role")
    router.push("/admin/login")
  }

  const handleViewDetails = (provider: PendingProvider) => {
    setSelectedProvider(provider)
    setDetailsOpen(true)
  }

  const handleViewCertificate = (url: string) => {
    setViewCertificateUrl(url)
    setCertificateOpen(true)
  }

  const handleApproveProvider = async (providerId: number) => {
    try {
      setIsApproving(true)
      await api.approveProvider(providerId)
      toast({
        title: "Provider approved",
        description: "The provider has been approved and notified via email.",
        variant: "default",
      })
      // Refresh the list
      fetchPendingProviders()
      setDetailsOpen(false)
    } catch (error) {
      console.error("Error approving provider:", error)
      toast({
        title: "Approval failed",
        description: "Failed to approve the provider. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsApproving(false)
    }
  }

  const handleAdminInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setAdminFormData((prev) => ({
      ...prev,
      [id]: value,
    }))
    // Clear error when typing
    if (id in formErrors) {
      setFormErrors((prev) => ({
        ...prev,
        [id]: "",
      }))
    }
  }

  const validateAdminForm = () => {
    let isValid = true
    const errors = {
      username: "",
      email: "",
      password: "",
      confirm_password: "",
    }
    if (!adminFormData.username.trim()) {
      errors.username = "Username is required"
      isValid = false
    }
    if (!isValidEmail(adminFormData.email)) {
      errors.email = "Please enter a valid email address"
      isValid = false
    }
    if (!isStrongPassword(adminFormData.password)) {
      errors.password =
        "Password must be at least 8 characters with uppercase, lowercase, number, and special character"
      isValid = false
    }
    if (!passwordsMatch(adminFormData.password, adminFormData.confirm_password)) {
      errors.confirm_password = "Passwords do not match"
      isValid = false
    }
    setFormErrors(errors)
    return isValid
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateAdminForm()) {
      return
    }
    setIsCreatingAdmin(true)
    try {
      await api.createAdminUser(adminFormData)
      toast({
        title: "Admin created",
        description: "The admin user has been created successfully.",
        variant: "default",
      })
      // Reset form and close dialog
      setAdminFormData({
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        password: "",
        confirm_password: "",
      })
      setCreateAdminOpen(false)
    } catch (error) {
      console.error("Error creating admin:", error)
      toast({
        title: "Creation failed",
        description: "Failed to create admin user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreatingAdmin(false)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date)
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r shadow-sm hidden md:block">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Image
              src="/interconnected-shapes.png"
              alt="Mother's Garage Logo"
              width={40}
              height={40}
              className="rounded-md"
            />
            <span className="font-bold text-xl text-[#832D90]">Super Admin</span>
          </div>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <Link
                href="/super-admin/dashboard"
                className="flex items-center gap-2 p-2 rounded-md bg-[#832D90]/10 text-[#832D90] font-medium"
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                href="/super-admin/dashboard"
                className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100"
              >
                <Users className="h-4 w-4" />
                Providers
              </Link>
            </li>
            <li>
              <Link
                href="/super-admin/dashboard"
                className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100"
              >
                <User className="h-4 w-4" />
                Mothers
              </Link>
            </li>
            <li>
              <Link
                href="/super-admin/dashboard"
                className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100"
              >
                <UserPlus className="h-4 w-4" />
                Admin Users
              </Link>
            </li>
            <li>
              <Link
                href="/super-admin/dashboard"
                className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </li>
          </ul>
        </nav>
        <div className="absolute bottom-0 w-64 p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <div className="md:hidden flex items-center gap-2">
              <Image
                src="/interconnected-shapes.png"
                alt="Mother's Garage Logo"
                width={40}
                height={40}
                className="rounded-md"
              />
              <span className="font-bold text-xl text-[#832D90]">Super Admin</span>
            </div>

            <div className="flex items-center gap-3">
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
              </Button>
              <div className="h-8 w-8 rounded-full bg-[#832D90] flex items-center justify-center text-white font-medium cursor-pointer">
                S
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-[#832D90]">Super Admin Dashboard</h1>
              <p className="text-gray-600">
                Manage provider applications, admin users, and system settings
              </p>
            </div>
            <Button
              className="bg-[#832D90] hover:bg-[#832D90]/90"
              onClick={() => setCreateAdminOpen(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Create Admin User
            </Button>
          </div>

          {/* Pending Providers Section */}
          <section className="mb-8">
            <Card>
              <CardHeader className="pb-2 border-b">
                <CardTitle className="text-xl flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-[#832D90]/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-[#832D90]" />
                  </div>
                  Pending Provider Applications
                </CardTitle>
                <CardDescription>
                  Review and approve service provider applications
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {isLoading ? (
                  <div className="space-y-4">
                    <div className="h-16 bg-gray-100 animate-pulse rounded-md"></div>
                    <div className="h-16 bg-gray-100 animate-pulse rounded-md"></div>
                  </div>
                ) : pendingProviders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Name</th>
                          <th className="text-left py-3 px-4">Email</th>
                          <th className="text-left py-3 px-4">Profession</th>
                          <th className="text-left py-3 px-4">Applied On</th>
                          <th className="text-left py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingProviders.map((provider) => (
                          <tr key={provider.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">
                              {provider.first_name} {provider.last_name}
                            </td>
                            <td className="py-3 px-4">{provider.email}</td>
                            <td className="py-3 px-4">{provider.profession}</td>
                            <td className="py-3 px-4">{formatDate(provider.created_at)}</td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewDetails(provider)}
                                >
                                  View Details
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-[#832D90] hover:bg-[#832D90]/90"
                                  onClick={() => handleApproveProvider(provider.id)}
                                >
                                  Approve
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="h-16 w-16 bg-[#832D90]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-6 w-6 text-[#832D90]" />
                    </div>
                    <p className="text-gray-500 mb-4">
                      No pending provider applications
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </main>
      </div>

      {/* Provider Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Provider Application Details</DialogTitle>
            <DialogDescription>
              Review the provider&apos;s information and credentials
            </DialogDescription>
          </DialogHeader>

          {selectedProvider && (
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">Full Name</h3>
                  <p>
                    {selectedProvider.first_name} {selectedProvider.last_name}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">Username</h3>
                  <p>{selectedProvider.username}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">Email</h3>
                  <p>{selectedProvider.email}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">Phone Number</h3>
                  <p>{selectedProvider.phone_number}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">Profession</h3>
                  <p>{selectedProvider.profession}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">License Number</h3>
                  <p>{selectedProvider.license_number}</p>
                </div>
                {selectedProvider.associated_clinic_health_center && (
                  <div className="col-span-2">
                    <h3 className="font-semibold text-sm text-gray-500">
                      Associated Clinic/Health Center
                    </h3>
                    <p>{selectedProvider.associated_clinic_health_center}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <h3 className="font-semibold text-sm text-gray-500">Professional Bio</h3>
                  <p className="text-sm">{selectedProvider.bio}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-gray-500 mb-2">Certificates</h3>
                {selectedProvider.certificates.length > 0 ? (
                  <div className="space-y-2">
                    {selectedProvider.certificates.map((cert) => (
                      <div
                        key={cert.id}
                        className="flex items-center justify-between p-2 border rounded-md"
                      >
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-[#832D90]" />
                          <span>{cert.name}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewCertificate(cert.url)}
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No certificates uploaded</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Cancel
            </Button>
            {selectedProvider && (
              <Button
                className="bg-[#832D90] hover:bg-[#832D90]/90"
                onClick={() => handleApproveProvider(selectedProvider.id)}
                disabled={isApproving}
              >
                {isApproving ? "Approving..." : "Approve Provider"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Certificate Viewer Dialog */}
      <Dialog open={certificateOpen} onOpenChange={setCertificateOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Certificate</DialogTitle>
          </DialogHeader>

          {viewCertificateUrl && (
            <div className="h-[70vh] w-full">
              <iframe
                src={viewCertificateUrl}
                className="w-full h-full border rounded-md"
                title="Certificate Viewer"
              />
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setCertificateOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Admin User Dialog */}
      <Dialog open={createAdminOpen} onOpenChange={setCreateAdminOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Admin User</DialogTitle>
            <DialogDescription>Add a new administrator to the system</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={adminFormData.first_name}
                  onChange={handleAdminInputChange}
                  placeholder="Enter first name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={adminFormData.last_name}
                  onChange={handleAdminInputChange}
                  placeholder="Enter last name"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={adminFormData.username}
                onChange={handleAdminInputChange}
                placeholder="Enter username"
                required
              />
              {formErrors.username && <p className="text-red-500 text-xs">{formErrors.username}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={adminFormData.email}
                onChange={handleAdminInputChange}
                placeholder="Enter email address"
                required
              />
              {formErrors.email && <p className="text-red-500 text-xs">{formErrors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={adminFormData.password}
                onChange={handleAdminInputChange}
                placeholder="Create password"
                required
              />
              {formErrors.password && <p className="text-red-500 text-xs">{formErrors.password}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm Password</Label>
              <Input
                id="confirm_password"
                type="password"
                value={adminFormData.confirm_password}
                onChange={handleAdminInputChange}
                placeholder="Confirm password"
                required
              />
              {formErrors.confirm_password && (
                <p className="text-red-500 text-xs">{formErrors.confirm_password}</p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setCreateAdminOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#832D90] hover:bg-[#832D90]/90" disabled={isCreatingAdmin}>
                {isCreatingAdmin ? "Creating..." : "Create Admin User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
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
      <div className={`h-2 w-full bg-[${color}]`} />
      <CardHeader className="pb-2">
        <div className={`flex items-center gap-3`}>
          <div className={`h-10 w-10 rounded-full flex items-center justify-center bg-[${color}]`}>
            {icon}
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <CardDescription>{description}</CardDescription>
      </CardContent>
      <CardFooter>
        <Button className={`w-full text-white bg-[${color}] hover:opacity-90 transition-opacity`}>
          Access Module
        </Button>
      </CardFooter>
    </Card>
  )
}
