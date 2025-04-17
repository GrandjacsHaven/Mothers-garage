"use client"
import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Bell,
  CheckCircle,
  FileText,
  Home,
  LogOut,
  Search,
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

interface PendingProvider {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  profession: string;
  license_number: string;
  bio: string;
  associated_clinic: string; // updated field name from 'associated_clinic_health_center'
  certificates: string[];    // array of file paths (if needed elsewhere)
  certificate_urls: string[]; // full URLs for preview (provided by the serializer)
  created_at: string;
}


export default function AdminDashboard() {
  const { toast } = useToast()
  const router = useRouter()
  const [pendingProviders, setPendingProviders] = useState<PendingProvider[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProvider, setSelectedProvider] = useState<PendingProvider | null>(null)
  const [viewCertificateUrl, setViewCertificateUrl] = useState<string | null>(null)
  const [isApproving, setIsApproving] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [certificateOpen, setCertificateOpen] = useState(false)

  // Fetch pending providers on mount
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
  }, [toast]) // Include dependencies if any are used from outer scope
  
  useEffect(() => {
    fetchPendingProviders()
  }, [fetchPendingProviders]) // ✅ now it's clean and ESLint-friendly

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

      // Refresh list after approval
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

  // Helper function to format dates for display
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
              alt="Mother&apos;s Garage Logo"
              width={40}
              height={40}
              className="rounded-md"
            />
            <span className="font-bold text-xl text-[#832D90]">Admin Panel</span>
          </div>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-2 p-2 rounded-md bg-[#832D90]/10 text-[#832D90] font-medium"
              >
                <Home className="h-4 w-4" />
                Dashboard
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
                alt="Mother&apos;s Garage Logo"
                width={40}
                height={40}
                className="rounded-md"
              />
              <span className="font-bold text-xl text-[#832D90]">Admin</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="py-2 px-4 pr-10 rounded-full border border-gray-200 text-sm focus:outline-none w-[200px]"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              <Button variant="ghost" size="icon" className="relative hover:bg-[#F8F8F8]">
                <Bell className="h-5 w-5 text-gray-600" />
              </Button>
              <div className="h-8 w-8 rounded-full bg-[#832D90] flex items-center justify-center text-white font-medium cursor-pointer">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#832D90]">Admin Dashboard</h1>
            <p className="text-gray-600">
              Manage provider applications and system settings
            </p>
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
                            <td className="py-3 px-4">
                              {formatDate(provider.created_at)}
                            </td>
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

      {/* Dialogs for Provider Details and Certificate Viewer */}
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
                {/* Existing provider details remain */}
                
                {/* New Certificates Section */}
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">Certificates</h3>
                  {selectedProvider.certificate_urls && selectedProvider.certificate_urls.length > 0 ? (
                    <div className="space-y-2 mt-2">
                      {selectedProvider.certificate_urls.map((url, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewCertificate(url)}
                        >
                          View Certificate {index + 1}
                        </Button>
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
    </div>
  )
}
