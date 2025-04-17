"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Loader2 } from "lucide-react"
import { api } from "@/lib/api"

interface SettingsData {
  email: string
  first_name: string
  last_name: string
  phone_number: string
  bio: string
  license_number: string
  associated_clinic: string
  old_password?: string
  new_password?: string
  confirm_new_password?: string
  country?: string
  preferred_language?: string
}

export default function ProviderSettings() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<SettingsData>({
    email: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    bio: "",
    license_number: "",
    associated_clinic: "",
    country: "Uganda",
    preferred_language: "English",
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true)
        const data = await api.getProviderSettings()
        setFormData(data)
      } catch (error) {
        console.error("Error fetching settings:", error)
        toast({
          title: "Error",
          description: "Failed to load settings. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
  
    fetchSettings()
  }, [toast])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
  
    const { old_password, new_password, confirm_new_password } = formData
  
    // 🚨 Frontend password validation before sending
    if (old_password || new_password || confirm_new_password) {
      if (!old_password || !new_password || !confirm_new_password) {
        toast({
          title: "Password Error",
          description: "Please fill in all password fields.",
          variant: "destructive",
        })
        return
      }
  
      if (new_password !== confirm_new_password) {
        toast({
          title: "Password Mismatch",
          description: "New passwords do not match.",
          variant: "destructive",
        })
        return
      }
    }
  
    try {
      setIsSaving(true)
  
      // Clean up password fields if not all are provided
      const submitData = { ...formData }
      if (!old_password || !new_password || !confirm_new_password) {
        delete submitData.old_password
        delete submitData.new_password
        delete submitData.confirm_new_password
      }
  
      await api.updateProviderSettings(submitData)
  
      toast({
        title: "Success",
        description: "Your settings have been updated successfully.",
      })
  
      setFormData((prev) => ({
        ...prev,
        old_password: "",
        new_password: "",
        confirm_new_password: "",
      }))
    } catch (error: any) {
      console.error("Error updating settings:", error)
  
      const detail = error?.response?.data?.detail
  
      let readableMessage = "Failed to update settings."
      if (Array.isArray(detail)) {
        readableMessage = detail.join(" ")
      } else if (typeof detail === "object") {
        try {
          readableMessage = Object.values(detail).flat().map((v) => String(v)).join(" ")
        } catch {
          readableMessage = JSON.stringify(detail)
        }
      } else if (typeof detail === "string") {
        readableMessage = detail
      } else {
        readableMessage = String(detail)
      }
  
      toast({
        title: "Update Failed",
        description: readableMessage,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }
  

  const goBack = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-[#832D90]" />
          <p className="text-gray-500">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Button
        variant="ghost"
        className="mb-6 pl-0 text-gray-500 hover:text-[#832D90] hover:bg-transparent"
        onClick={goBack}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <Card className="border-none shadow-lg">
        <CardHeader className="bg-[#832D90]/5 border-b">
          <CardTitle className="text-2xl text-[#832D90]">Account Settings</CardTitle>
          <CardDescription>Update your professional information and preferences</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Personal Information</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input id="first_name" name="first_name" value={formData.first_name} onChange={handleInputChange} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input id="last_name" name="last_name" value={formData.last_name} onChange={handleInputChange} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select
                    value={formData.country || "Uganda"}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, country: value }))}
                  >
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Uganda">Uganda</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferred_language">Preferred Language</Label>
                  <Select
                    value={formData.preferred_language || "English"}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, preferred_language: value }))}
                  >
                    <SelectTrigger id="preferred_language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="French">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Professional Information</h3>

              <div className="space-y-2">
                <Label htmlFor="bio">Professional Bio</Label>
                <Textarea id="bio" name="bio" value={formData.bio} onChange={handleInputChange} rows={4} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="license_number">License Number</Label>
                  <Input
                    id="license_number"
                    name="license_number"
                    value={formData.license_number}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">License number cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="associated_clinic">Associated Clinic (Optional)</Label>
                  <Input
                    id="associated_clinic"
                    name="associated_clinic"
                    value={formData.associated_clinic}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-medium">Change Password</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="old_password">Old Password</Label>
                  <Input
                    id="old_password"
                    name="old_password"
                    type="password"
                    value={formData.old_password || ""}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <Input
                    id="new_password"
                    name="new_password"
                    type="password"
                    value={formData.new_password || ""}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_new_password">Confirm New Password</Label>
                  <Input
                    id="confirm_new_password"
                    name="confirm_new_password"
                    type="password"
                    value={formData.confirm_new_password || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between items-center gap-4 border-t pt-6 flex-wrap">
                {/* Left-aligned: Update Subscription */}
                <Button
                  className="bg-[#832D90] hover:bg-[#832D90]/90"
                  onClick={() => router.push("/provider/subscription")}
                >
                  Update Subscription
                </Button>

                {/* Right-aligned: Cancel and Save */}
                <div className="flex gap-4">
                  <Button type="button" variant="outline" onClick={goBack}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#832D90] hover:bg-[#832D90]/90" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </CardFooter>

        </form>
      </Card>
    </div>
  )
}
